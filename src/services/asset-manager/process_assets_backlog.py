import os, sys, json, shutil, subprocess, logging, urllib.request
from datetime import datetime
from typing import List, Dict, Optional

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("process_assets_backlog")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
BACKLOG_FILE = os.path.join(PROJECT_ROOT, "public", "missing_assets_backlog.jsonl")
REGISTRY_FILE = os.path.join(PROJECT_ROOT, "public", "asset_registry.json")
SFX_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "assets", "sfx")
BGM_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "assets", "bgm")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "output")
QUEUE_FILE = os.path.join(OUTPUT_DIR, "asset_generation_queue.json")
VALID_TYPES = {"SFX", "BGM", "background", "prop"}


def _esc(s: str) -> str:
    return json.dumps(s)[1:-1]


def read_backlog() -> List[Dict]:
    if not os.path.exists(BACKLOG_FILE):
        logger.warning("Backlog file not found: %s", BACKLOG_FILE)
        return []
    entries = []
    with open(BACKLOG_FILE, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                entries.append(entry)
            except json.JSONDecodeError:
                logger.warning("Skipping malformed JSON at line %d: %s", line_num, repr(line[:200]))
    return entries


def classify_entries(entries: List[Dict]) -> Dict[str, List[Dict]]:
    type_map = {t.upper(): t for t in VALID_TYPES}
    queue = {k: [] for k in VALID_TYPES}
    for entry in entries:
        raw_type = (entry.get("asset_type") or "").strip()
        asset_type = type_map.get(raw_type.upper())
        if asset_type:
            queue[asset_type].append(entry)
        else:
            logger.warning("Unknown asset_type %r for suggested_id=%s, skipping", raw_type, entry.get("suggested_id", "?"))
    return queue


def check_infsh_available() -> bool:
    return shutil.which("infsh") is not None


def _save_infsh_output(stdout: str, filepath: str):
    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        with open(filepath + ".raw", "w", encoding="utf-8") as f:
            f.write(stdout)
        return
    url = data.get("url") or data.get("output_url") or data.get("audio_url")
    if url:
        urllib.request.urlretrieve(url, filepath)
        logger.info("Downloaded SFX to: %s", filepath)
    else:
        with open(filepath + ".json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def generate_sfx(entry: Dict) -> Optional[Dict]:
    description = entry.get("description", "")
    suggested_id = entry.get("suggested_id", "sfx_unknown")
    filepath = os.path.join(SFX_OUTPUT_DIR, f"{suggested_id}.mp3")
    os.makedirs(SFX_OUTPUT_DIR, exist_ok=True)
    if os.path.exists(filepath):
        logger.info("Skipping existing SFX: %s", filepath)
        return {"asset_id": suggested_id, "asset_type": "SFX", "description": description, "filepath": filepath, "method": "cached"}
    if check_infsh_available():
        logger.info("Generating SFX via infsh: %s", suggested_id)
        try:
            input_payload = json.dumps({"text": description, "duration_seconds": 5})
            result = subprocess.run(
                ["infsh", "app", "run", "elevenlabs/sound-effects", "--input", input_payload],
                capture_output=True, text=True, timeout=60, cwd=PROJECT_ROOT
            )
            logger.info("infsh stdout: %s", result.stdout[:200] if result.stdout else "(empty)")
            if result.returncode == 0:
                try:
                    _save_infsh_output(result.stdout, filepath)
                except Exception as save_err:
                    logger.warning("Could not save infsh output to file: %s", save_err)
                return {"asset_id": suggested_id, "asset_type": "SFX", "description": description, "filepath": filepath, "method": "infsh-generated"}
            else:
                logger.warning("infsh failed with exit code %d: %s", result.returncode, result.stderr[:200])
        except subprocess.TimeoutExpired:
            logger.warning("infsh timed out for SFX: %s", suggested_id)
        except Exception as e:
            logger.warning("infsh error: %s", e)
    logger.info("Falling back to prompt-only for SFX: %s", suggested_id)
    return {"asset_id": suggested_id, "asset_type": "SFX", "description": description, "method": "prompt_queued", "generated_prompt": _build_sfx_prompt(description)}


def _build_sfx_prompt(description: str) -> str:
    esc = _esc(description)
    return (
        "ElevenLabs Sound Effect Generation Prompt:\n"
        "---\n"
        '"text": "' + esc + '",\n'
        '"duration_seconds": 5,\n'
        '"prompt_influence": 0.5\n'
        "---\n"
        "Command: infsh app run elevenlabs/sound-effects --input '{\"text\": \"" + esc + "\"}'\n"
    )


def generate_bgm(entry: Dict) -> Dict:
    description = entry.get("description", "")
    suggested_id = entry.get("suggested_id", "bgm_unknown")
    filepath = os.path.join(BGM_OUTPUT_DIR, f"{suggested_id}.mp3")
    os.makedirs(BGM_OUTPUT_DIR, exist_ok=True)
    if os.path.exists(filepath):
        return {"asset_id": suggested_id, "asset_type": "BGM", "description": description, "filepath": filepath, "method": "cached"}
    return {"asset_id": suggested_id, "asset_type": "BGM", "description": description, "method": "prompt_queued", "generated_prompt": _build_bgm_prompt(description)}


def _build_bgm_prompt(description: str) -> str:
    esc = _esc(description)
    return (
        "ElevenLabs Music Generation Prompt:\n"
        "---\n"
        '"text": "' + esc + '"\n'
        "---\n"
        "Command: infsh app run elevenlabs/music --input '{\"text\": \"" + esc + "\"}'\n"
    )


def generate_background(entry: Dict) -> Dict:
    description = entry.get("description", "")
    suggested_id = entry.get("suggested_id", "bg_unknown")
    return {"asset_id": suggested_id, "asset_type": "background", "description": description, "method": "prompt_queued", "generated_prompt": _build_image_prompt("background", description, suggested_id)}


def generate_prop(entry: Dict) -> Dict:
    description = entry.get("description", "")
    suggested_id = entry.get("suggested_id", "prop_unknown")
    return {"asset_id": suggested_id, "asset_type": "prop", "description": description, "method": "prompt_queued", "generated_prompt": _build_image_prompt("prop", description, suggested_id)}


def _build_image_prompt(asset_type: str, description: str, suggested_id: str) -> str:
    if asset_type == "background":
        style_tags = "<scene_style>2D cartoon animation background, flat colors, cel-shaded, Vietnamese animation style, consistent with Doraemon art style, clean lines, no characters, environment only</scene_style>"
    else:
        style_tags = "<prop_style>2D cartoon prop, flat colors, cel-shaded, transparent background, game-ready asset, consistent style</prop_style>"
    return (
        f"Image Generation Prompt for [{suggested_id}]:\n"
        "---\n"
        f"{style_tags}\n"
        f"<description>{_esc(description)}</description>\n"
        "<format>2048x2048 PNG, alpha channel for props</format>\n"
        "---\n"
    )


def update_registry(new_assets: List[Dict]):
    if not os.path.exists(REGISTRY_FILE):
        logger.warning("Registry file not found: %s", REGISTRY_FILE)
        return
    with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
        registry = json.load(f)
    audio_section = registry.setdefault("audioTracks", [])
    backgrounds_section = registry.setdefault("backgrounds", [])
    props_section = registry.setdefault("props", [])
    existing_audio_ids = {item["id"] for item in audio_section if "id" in item}
    existing_bg_ids = {item["id"] for item in backgrounds_section if "id" in item}
    existing_prop_ids = {item["id"] for item in props_section if "id" in item}
    additions = 0
    for asset in new_assets:
        asset_id = asset.get("asset_id", "")
        asset_type = asset.get("asset_type", "")
        description = asset.get("description", "")
        if asset_type == "SFX":
            if asset_id not in existing_audio_ids:
                audio_section.append({"id": asset_id, "type": "sfx", "description": description, "auto_generated": True, "generated_at": datetime.now().isoformat()})
                existing_audio_ids.add(asset_id)
                additions += 1
        elif asset_type == "BGM":
            if asset_id not in existing_audio_ids:
                audio_section.append({"id": asset_id, "type": "bgm", "description": description, "auto_generated": True, "generated_at": datetime.now().isoformat()})
                existing_audio_ids.add(asset_id)
                additions += 1
        elif asset_type == "background":
            if asset_id not in existing_bg_ids:
                backgrounds_section.append({"id": asset_id, "description": description, "auto_generated": True, "generated_at": datetime.now().isoformat()})
                existing_bg_ids.add(asset_id)
                additions += 1
        elif asset_type == "prop":
            if asset_id not in existing_prop_ids:
                props_section.append({"id": asset_id, "description": description, "auto_generated": True, "generated_at": datetime.now().isoformat()})
                existing_prop_ids.add(asset_id)
                additions += 1
    tmp_path = REGISTRY_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, REGISTRY_FILE)
    if additions > 0:
        logger.info("Registry updated: %d new assets added to asset_registry.json", additions)


def archive_and_clear_backlog():
    if not os.path.exists(BACKLOG_FILE):
        return
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = os.path.join(OUTPUT_DIR, f"missing_assets_backlog_{timestamp}.jsonl")
    shutil.move(BACKLOG_FILE, archive_path)
    logger.info("Backlog archived to %s", archive_path)


def process_backlog():
    logger.info("=== Missing Asset Backlog Processor ===")
    logger.info("Reading backlog: %s", BACKLOG_FILE)
    entries = read_backlog()
    if not entries:
        logger.info("No entries in backlog. Nothing to process.")
        return
    logger.info("Found %d entries in backlog", len(entries))
    queue = classify_entries(entries)
    summary = {k: len(v) for k, v in queue.items() if v}
    logger.info("Classification: %s", json.dumps(summary))
    infsh_available = check_infsh_available()
    if infsh_available:
        logger.info("infsh CLI detected - will attempt live SFX generation")
    else:
        logger.info("infsh CLI not found - will generate prompt plans only")
    results = []
    for entry in queue.get("SFX", []):
        result = generate_sfx(entry)
        if result:
            results.append(result)
    for entry in queue.get("BGM", []):
        result = generate_bgm(entry)
        if result:
            results.append(result)
    for entry in queue.get("background", []):
        result = generate_background(entry)
        if result:
            results.append(result)
    for entry in queue.get("prop", []):
        result = generate_prop(entry)
        if result:
            results.append(result)
    if results:
        update_registry(results)
    queue_output = {"processed_at": datetime.now().isoformat(), "total_entries": len(entries), "results": results}
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(queue_output, f, ensure_ascii=False, indent=2)
    logger.info("Queue/plan written to %s", QUEUE_FILE)
    archive_and_clear_backlog()
    prompt_count = sum(1 for r in results if r.get("method") == "prompt_queued")
    generated_count = sum(1 for r in results if r.get("method") in ("infsh-generated", "cached"))
    logger.info("=== Summary ===")
    logger.info("Total entries processed: %d", len(entries))
    logger.info("Assets generated/cached: %d", generated_count)
    logger.info("Prompt plans queued: %d", prompt_count)
    logger.info("Queue file: %s", QUEUE_FILE)


if __name__ == "__main__":
    process_backlog()