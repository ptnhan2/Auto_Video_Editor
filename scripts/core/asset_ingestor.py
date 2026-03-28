import os
import xml.etree.ElementTree as ET
import json
import re
import sys
import hashlib
from pathlib import Path
from PIL import Image

# Set encoding for console output (Windows fix)
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# ---------------------------------------------------------
# CONSTANTS & CONFIGURATION
# ---------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "src", "config", "asset_types.json")

def load_config():
    """Load asset definitions from external JSON (Open-Closed Principle)"""
    if not os.path.exists(CONFIG_PATH):
        print(f"❌ Critical Error: Configuration file not found at {CONFIG_PATH}")
        sys.exit(1)
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# ---------------------------------------------------------
# INGESTOR LOGIC
# ---------------------------------------------------------
class AssetIngestor:
    """
    Unified Asset Pipeline Ingestor
    Parses raw Adobe Animate atlases, cleans naming conventions,
    and prepares data for AI-based auto-labeling.
    """
    def __init__(self, asset_type: str, category_prefix: str, raw_xml_path: str, raw_png_path: str, config: dict):
        self.asset_type = asset_type # e.g., 'expression', 'item', 'character_part'
        self.category_prefix = category_prefix # e.g., 'female', 'sword'
        self.raw_xml_path = raw_xml_path
        self.raw_png_path = raw_png_path
        self.config = config
        
        # Look up standard prefix and output folder dynamically
        type_info = self.config['asset_types'].get(self.asset_type, {})
        self.type_short = type_info.get('prefix', 'asset')
        self.base_output_folder = type_info.get('output_folder', 'misc')
        
        self.base_dir = os.path.join(PROJECT_ROOT, "public", "assets", self.base_output_folder)
        self.output_dir = "" # Set during processing

    def get_file_md5(self, filepath):
        if not os.path.exists(filepath):
            return ""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def parse_atlas_xml(self):
        """Parse raw XML into grouped frames by symbol"""
        if not os.path.exists(self.raw_xml_path):
            print(f"❌ File not found: {self.raw_xml_path}")
            return None

        tree = ET.parse(self.raw_xml_path)
        root = tree.getroot()
        grouped_assets = {}

        for subtexture in root.findall('SubTexture'):
            raw_name = subtexture.get('name')
            # Extract raw symbol prefix and frame number (assuming last 4 digits are frame)
            match = re.match(r"^(.*?)\s*(\d{4,})$", raw_name)
            
            if match:
                raw_prefix = match.group(0)[:-4].strip()
                frame_num = match.group(0)[-4:]
            else:
                raw_prefix = raw_name.strip()
                frame_num = "0000"

            if raw_prefix not in grouped_assets:
                grouped_assets[raw_prefix] = []

            # Parse Starling/Adobe Animate frame offsets if available
            # frameX/Y is the offset of the trimmed sprite from the top-left of the original symbol
            # frameWidth/Height is the original size of the symbol before trimming
            w = int(subtexture.get('width'))
            h = int(subtexture.get('height'))
            
            frame_data = {
                "x": int(subtexture.get('x')),
                "y": int(subtexture.get('y')),
                "w": w,
                "h": h,
                "offX": int(subtexture.get('frameX', 0)),
                "offY": int(subtexture.get('frameY', 0)),
                "sourceW": int(subtexture.get('frameWidth', w)),
                "sourceH": int(subtexture.get('frameHeight', h))
            }
            grouped_assets[raw_prefix].append(frame_data)

        return grouped_assets

    def mock_ai_vision_tagging(self, image_crop):
        """
        [TODO: INTEGRATE REAL LLM API (e.g. Gemini Vision)]
        Given a PIL Image crop, ask AI to classify it based on the asset_type context.
        """
        return {
            "tags": [self.asset_type, self.category_prefix, "auto_tagged"],
            "description": f"Auto-ingested {self.asset_type} asset."
        }

    def process(self):
        print(f"\n🚀 Starting Ingestion Pipeline")
        print(f"   • Asset Type: {self.asset_type}")
        print(f"   • Category:   {self.category_prefix}")
        
        xml_hash = self.get_file_md5(self.raw_xml_path)
        png_hash = self.get_file_md5(self.raw_png_path)
        
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Check for duplicates using MD5
        counter = 1
        for item in os.listdir(self.base_dir):
            if item.startswith(f"{self.category_prefix}_"):
                counter += 1 # Increment base counter for new dirs
                manifest_file = os.path.join(self.base_dir, item, "asset_manifest.json")
                if os.path.exists(manifest_file):
                    try:
                        with open(manifest_file, 'r', encoding='utf-8') as f:
                            existing_manifest = json.load(f)
                            existing_hashes = existing_manifest.get("source_hashes", {})
                            if existing_hashes.get("xml") == xml_hash and existing_hashes.get("png") == png_hash:
                                print(f"⚠️  BỎ QUA: Phát hiện trùng lặp dữ liệu (MD5 khớp) ở thư mục '{item}'.")
                                print("   Không cần ingest lại các file này nữa.\n")
                                return
                    except Exception:
                        pass
                        
        # Find next available directory
        while True:
            dir_name = f"{self.category_prefix}_{counter:02d}"
            self.output_dir = os.path.join(self.base_dir, dir_name)
            if not os.path.exists(self.output_dir):
                break
            counter += 1

        print(f"   • Output Dir: {self.output_dir}\n")

        raw_assets = self.parse_atlas_xml()
        if not raw_assets:
            return

        os.makedirs(self.output_dir, exist_ok=True)
        
        # Auto-extract base metrics from the first frame of the first asset
        first_asset_key = list(raw_assets.keys())[0]
        first_frame = raw_assets[first_asset_key][0]
        
        manifest = {
            "pack_id": f"{self.category_prefix}_pack",
            "asset_type": self.asset_type,
            "source_image": os.path.basename(self.raw_png_path),
            "source_hashes": {
                "xml": xml_hash,
                "png": png_hash
            },
            "metrics": {
                "width": first_frame['w'],
                "height": first_frame['h']
            },
            "assets": []
        }

        # Open the sprite sheet for cropping samples
        try:
            sprite_sheet = Image.open(self.raw_png_path)
        except Exception as e:
            print(f"⚠️ Warning: Failed to open image {self.raw_png_path} for AI sample cropping: {e}")
            sprite_sheet = None

        count = 1
        for raw_prefix, frames in raw_assets.items():
            # Clean Naming Convention: [type]_[category]_[id]
            clean_id = f"{self.type_short}_{self.category_prefix}_{count:03d}"
            
            clean_frames = []
            for idx, frame in enumerate(frames):
                clean_frames.append({
                    "name": f"frame_{idx}",
                    **frame
                })

            ai_meta = {"tags": [self.category_prefix], "description": "TBD"}
            if sprite_sheet and len(frames) > 0:
                f0 = frames[0]
                crop = sprite_sheet.crop((f0['x'], f0['y'], f0['x'] + f0['w'], f0['y'] + f0['h']))
                ai_meta = self.mock_ai_vision_tagging(crop)

            asset_obj = {
                "asset_id": clean_id,
                "tags": ai_meta["tags"],
                "description": ai_meta["description"],
                "sprites": clean_frames
            }
            manifest["assets"].append(asset_obj)
            count += 1

        # Save Final Manifest
        manifest_path = os.path.join(self.output_dir, "asset_manifest.json")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # Copy original PNG to output directory
        import shutil
        dest_png_path = os.path.join(self.output_dir, os.path.basename(self.raw_png_path))
        if self.raw_png_path != dest_png_path:
            shutil.copy2(self.raw_png_path, dest_png_path)
            print(f"🖼️ Copied sprite sheet to: {dest_png_path}")
            
        print(f"✅ Extracted and cleaned {len(raw_assets)} assets.")
        print(f"📁 Saved manifest to: {manifest_path}")

# ---------------------------------------------------------
# INTERACTIVE CLI MENU
# ---------------------------------------------------------
def run_interactive_menu():
    print("="*50)
    print(" 🛠️  AUTO VIDEO EDITOR - ASSET INGESTOR PIPELINE")
    print("="*50)
    print("Welcome! This tool will clean up your raw assets (XML/PNG) and prepare them for AI.\n")

    config = load_config()
    types = list(config['asset_types'].keys())
    
    # 1. Ask for Asset Type
    print("❓ Bước 1: Chọn loại tài nguyên (Asset Type):")
    for idx, t in enumerate(types):
        desc = config['asset_types'][t]['description']
        print(f"  [{idx + 1}] {t} - {desc}")
    
    while True:
        try:
            choice = input("\nNhập số tương ứng (1-5): ").strip()
            type_idx = int(choice) - 1
            if 0 <= type_idx < len(types):
                asset_type = types[type_idx]
                break
            else:
                print("⚠️ Lựa chọn không hợp lệ, vui lòng nhập lại.")
        except ValueError:
            print("⚠️ Vui lòng nhập một số.")
            
    # 2. Ask for Category Prefix
    print(f"\n❓ Bước 2: Nhập phân loại cụ thể / tên biến thể (Ví dụ: female, male, sword_iron, forest_day)")
    print("   (Hệ thống sẽ ghép lại thành: [prefix_trong_config]_[phân_loại_của_bạn]_001)")
    category_prefix = input("Tên phân loại (Category): ").strip().lower().replace(" ", "_")
    if not category_prefix:
        category_prefix = "unknown"

    # 3. Ask for File Paths
    print(f"\n❓ Bước 3: Nhập đường dẫn tới file XML thô (Kéo thả file vào terminal)")
    raw_xml_path = input("Path XML: ").strip().strip('"').strip("'")
    
    print(f"❓ Bước 4: Nhập đường dẫn tới file PNG thô (Kéo thả file vào terminal)")
    raw_png_path = input("Path PNG: ").strip().strip('"').strip("'")

    # Confirmation
    print("\n" + "="*50)
    print("📋 XÁC NHẬN THÔNG TIN:")
    print(f" - Asset Type:  {asset_type}")
    print(f" - Prefix:      {category_prefix}")
    print(f" - XML File:    {raw_xml_path}")
    print(f" - PNG File:    {raw_png_path}")
    print("="*50)
    
    confirm = input("Bạn có muốn tiến hành xử lý? (Y/n): ").strip().lower()
    if confirm != 'n':
        ingestor = AssetIngestor(
            asset_type=asset_type,
            category_prefix=category_prefix,
            raw_xml_path=raw_xml_path,
            raw_png_path=raw_png_path,
            config=config
        )
        ingestor.process()
    else:
        print("Đã hủy bỏ Ingestion.")

if __name__ == "__main__":
    try:
        run_interactive_menu()
    except KeyboardInterrupt:
        print("\nThoát chương trình.")
        sys.exit(0)
