import sys
import os
import subprocess
import time
import logging
import argparse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("run_pipeline")

STATION_SEQUENCE = ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]

STATION_META = {
    "S0": {"index": 0, "script": "src/pipeline/station_0_indexer.py", "name": "Indexer"},
    "S1": {"index": 1, "script": "src/pipeline/station_1_script_rewriter.py", "name": "Script Rewriter"},
    "S2": {"index": 2, "script": "src/pipeline/station_2_extractor.py", "name": "Extractor"},
    "S3": {"index": 3, "script": "src/pipeline/station_3_storyboard_breaker.py", "name": "Storyboard Breaker"},
    "S4": {"index": 4, "script": "src/pipeline/station_4_audio_generator.py", "name": "Audio Generator"},
    "S5": {"index": 5, "script": "src/pipeline/station_5_visual_director.py", "name": "Visual Director"},
    "S6": {"index": 6, "script": "src/pipeline/station_6_sound_vfx_engineer.py", "name": "Sound & VFX Engineer"},
    "S7": {"index": 7, "script": "src/pipeline/station_7_video_compiler.py", "name": "Video Compiler"},
    "S8": {"index": 8, "script": "src/services/video-builder/render_all.ts", "name": "Render MP4"},
}

def build_station_args(station_key, episode_id):
    if station_key == "S0":
        return []
    return [episode_id]

def run_station(station_key, episode_id):
    meta = STATION_META[station_key]
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), meta["script"])

    if not os.path.isfile(script_path):
        logger.warning("  [SKIP] File not found: %s", meta["script"])
        return True

    station_args = build_station_args(station_key, episode_id)
    
    if meta["script"].endswith(".ts"):
        npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
        cmd = [npx_cmd, "tsx", script_path] + station_args
    else:
        cmd = [sys.executable, script_path] + station_args

    logger.info("  Running: %s", " ".join(cmd))

    max_retries = 3
    base_delay = 10  # seconds

    for attempt in range(1, max_retries + 1):
        start = time.time()
        try:
            subprocess.run(cmd, check=True, capture_output=False)
            elapsed = time.time() - start
            logger.info("  OK (%.0fs)", elapsed)
            return True
        except subprocess.CalledProcessError as e:
            elapsed = time.time() - start
            logger.error("  FAILED after %.0fs (exit code %d)", elapsed, e.returncode)
            
            if attempt < max_retries:
                delay = base_delay * attempt
                logger.warning("  [RETRY] %s fail. Attempt %d/%d. Retrying in %ds...", meta["name"], attempt, max_retries, delay)
                time.sleep(delay)
            else:
                logger.error("  [FATAL] %s failed after %d retries.", meta["name"], max_retries)
                return False

    return False

def main():
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    parser = argparse.ArgumentParser(
        description="Run the full Auto Video Editor pipeline sequentially."
    )
    parser.add_argument("episode_id", help="Episode ID to process")
    parser.add_argument("--from", dest="from_station", metavar="STATION",
                        choices=STATION_SEQUENCE, help="Start from a specific station (e.g. S3)")
    parser.add_argument("--to", dest="to_station", metavar="STATION",
                        choices=STATION_SEQUENCE, help="Stop after a specific station (e.g. S5)")
    args = parser.parse_args()

    episode_id = args.episode_id
    from_idx = STATION_META[args.from_station]["index"] if args.from_station else 0
    to_idx = STATION_META[args.to_station]["index"] if args.to_station else len(STATION_SEQUENCE) - 1

    if from_idx > to_idx:
        logger.error("Invalid range: --from %s is after --to %s", args.from_station, args.to_station)
        sys.exit(1)

    stations_to_run = [s for s in STATION_SEQUENCE if from_idx <= STATION_META[s]["index"] <= to_idx]
    total_count = len(stations_to_run)

    logger.info("Pipeline: %s -> %s", stations_to_run[0], stations_to_run[-1])
    logger.info("Episode ID: %s", episode_id)
    logger.info("Stations to run: %d\n", total_count)

    pipeline_start = time.time()
    completed = 0

    for i, sk in enumerate(stations_to_run):
        meta = STATION_META[sk]
        station_num = meta["index"]
        logger.info("[%d/%d] Station %d: %s...", i + 1, total_count, station_num, meta["name"])

        success = run_station(sk, episode_id)
        if not success:
            logger.error("\nPipeline ABORTED at Station %d (%s).", station_num, meta["name"])
            sys.exit(1)

        completed += 1

    total_elapsed = time.time() - pipeline_start
    logger.info("\nPipeline complete: %d/%d stations OK (total %.0fs)", completed, total_count, total_elapsed)

if __name__ == "__main__":
    main()
