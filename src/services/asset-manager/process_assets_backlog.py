import os
import json
import logging
from typing import List, Dict

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("process_assets_backlog")

BACKLOG_FILE = "output/missing_assets_backlog.json"
PLAN_FILE = "output/asset_generation_plan.md"

def generate_plan(backlog: List[Dict]):
    if not backlog:
        logger.info("No missing assets to process.")
        return

    logger.info(f"Processing {len(backlog)} missing assets...")
    
    os.makedirs(os.path.dirname(PLAN_FILE), exist_ok=True)
    with open(PLAN_FILE, "w", encoding="utf-8") as f:
        f.write("# Asset Generation Plan\n\n")
        f.write("This document outlines the required skills/tools to generate missing assets based on the script requirements.\n\n")
        
        for idx, item in enumerate(backlog, start=1):
            asset_type = item.get("asset_type", "unknown")
            description = item.get("description", "No description provided")
            target_id = item.get("target_id")
            
            f.write(f"## {idx}. [{asset_type.upper()}] {description}\n")
            if target_id and target_id != "None" and target_id != "null":
                f.write(f"- **Target Character/Entity:** `{target_id}`\n")
                
            f.write("- **Recommended Action:**\n")
            
            if asset_type == "sfx":
                f.write("  - Use the **`elevenlabs-sound-effects`** skill to generate this sound effect.\n")
            elif asset_type == "voice":
                f.write("  - Use the **`elevenlabs-tts`** skill to generate this voice line.\n")
            elif asset_type == "action":
                f.write("  - Use the **`spine-animation`** skill to animate this action.\n")
            elif asset_type == "expression":
                f.write("  - Use the **`canvas-design`** skill or an image generation agent to create this facial expression.\n")
            elif asset_type == "character":
                f.write("  - Use an image generation agent or character design tool to create this character.\n")
            elif asset_type == "background":
                f.write("  - Use an image generation agent or background design tool to create this environment.\n")
            else:
                f.write("  - Review manually to determine the best generation tool.\n")
            
            f.write("\n")
            
    logger.info(f"✅ Asset generation plan written to {PLAN_FILE}")

def main():
    if not os.path.exists(BACKLOG_FILE):
        logger.warning(f"File {BACKLOG_FILE} not found. Skipping processing.")
        return
        
    try:
        with open(BACKLOG_FILE, "r", encoding="utf-8") as f:
            backlog = json.load(f)
            
        generate_plan(backlog)
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from {BACKLOG_FILE}. It might be corrupted or empty.")
    except Exception as e:
        logger.error(f"Error processing backlog: {e}")

if __name__ == "__main__":
    main()
