import os
import xml.etree.ElementTree as ET
import json
import re
import sys

# Set encoding for console output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def parse_adobe_xml(xml_path, system_json_path, ai_meta_path):
    """
    Parse XML from Adobe Animate, group frames by symbol, 
    generate system_atlas.json and a template ai_semantics.json
    """
    if not os.path.exists(xml_path):
        print(f"File not found: {xml_path}")
        return

    tree = ET.parse(xml_path)
    root = tree.getroot()
    image_path = root.get('imagePath')

    grouped_expressions = {}

    for subtexture in root.findall('SubTexture'):
        name = subtexture.get('name')
        
        # Regex to extract prefix and frame number
        # Matches formats like "元件 10000" or "Symbol 10000"
        # It assumes the last 4 digits are the frame number.
        match = re.match(r"^(.*?)\s*(\d{4,})$", name)
        
        if match:
            # Example: "元件 10000" -> prefix: "元件 1", frame_idx: "0000"
            # However, Adobe Animate's default naming is sometimes tricky.
            # If the original symbol is named "1", it becomes "10000".
            # If the original symbol is named "10", it becomes "100000".
            # Let's use a safer approach: Strip the last 4 characters if they are digits.
            
            raw_str = match.group(0)
            prefix = raw_str[:-4] # Everything except the last 4 characters
            frame_num = raw_str[-4:] # Last 4 characters
            
            # Clean up trailing spaces in prefix
            prefix = prefix.strip()
        else:
            # Fallback if no numbers at the end
            prefix = name
            frame_num = "0000"

        if prefix not in grouped_expressions:
            grouped_expressions[prefix] = []

        frame_data = {
            "name": name,
            "x": int(subtexture.get('x')),
            "y": int(subtexture.get('y')),
            "w": int(subtexture.get('width')),
            "h": int(subtexture.get('height'))
        }
        
        # Add frame offsets if they exist (for cropped/trimmed frames)
        if subtexture.get('frameX'):
             frame_data["frameX"] = int(subtexture.get('frameX'))
             frame_data["frameY"] = int(subtexture.get('frameY'))
             frame_data["frameWidth"] = int(subtexture.get('frameWidth'))
             frame_data["frameHeight"] = int(subtexture.get('frameHeight'))

        grouped_expressions[prefix].append(frame_data)

    # --- 1. GENERATE SYSTEM ATLAS JSON ---
    system_data = {
        "imagePath": image_path,
        "expressions": {}
    }
    
    # We will assign clean IDs for system usage (e.g., exp_001, exp_002)
    ai_mappings = []
    
    count = 1
    for prefix, frames in grouped_expressions.items():
        clean_id = f"exp_{count:03d}"
        
        system_data["expressions"][clean_id] = {
            "adobe_original_prefix": prefix,
            "frames": frames
        }
        
        ai_mappings.append({
            "id": clean_id,
            "adobe_original_prefix": prefix,
            "emotion_category": "neutral",
            "tags": [],
            "description": "TBD - Please describe this expression"
        })
        
        count += 1

    with open(system_json_path, 'w', encoding='utf-8') as f:
        json.dump(system_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated System Atlas: {system_json_path} ({len(grouped_expressions)} expressions found)")

    # --- 2. GENERATE AI METADATA TEMPLATE ---
    # Only generate if it doesn't exist, to avoid overwriting user's manual work
    if not os.path.exists(ai_meta_path):
        ai_meta = {
            "pack_id": os.path.basename(os.path.dirname(xml_path)),
            "style_tags": ["female", "anime", "2D"],
            "expressions": ai_mappings
        }
        with open(ai_meta_path, 'w', encoding='utf-8') as f:
            json.dump(ai_meta, f, indent=2, ensure_ascii=False)
        print(f"✅ Generated AI Metadata Template: {ai_meta_path}")
    else:
        print(f"ℹ️ AI Metadata already exists, skipping generation: {ai_meta_path}")

if __name__ == "__main__":
    PROJECT_ROOT = "c:/DevWork/Auto_Video_Editor"
    
    # Target folder
    TARGET_DIR = os.path.join(PROJECT_ROOT, "public/assets/female_expression/expression-batch-001")
    XML_FILE = os.path.join(TARGET_DIR, "female_expression_sprite_sheet_001.xml")
    
    SYSTEM_JSON = os.path.join(TARGET_DIR, "system_atlas.json")
    AI_META_JSON = os.path.join(TARGET_DIR, "ai_semantics.json")
    
    parse_adobe_xml(XML_FILE, SYSTEM_JSON, AI_META_JSON)
