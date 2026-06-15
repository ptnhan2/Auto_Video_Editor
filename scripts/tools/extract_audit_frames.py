import os
import sys
import json
import subprocess
import argparse
import math

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def extract_frames(episode_id):
    print(f"ðŸŽ¬ Báº¯t Ä‘áº§u trÃ­ch xuáº¥t frames cho episode: {episode_id}")
    
    # 1. Äá»c file JSON Ä‘á»ƒ láº¥y thÃ´ng tin duration
    json_path = f"public/scripts/compiled_{episode_id}.json"
    if not os.path.exists(json_path):
        print(f"âŒ KhÃ´ng tÃ¬m tháº¥y file JSON: {json_path}")
        sys.exit(1)
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # TÃ­nh tá»•ng sá»‘ frame (máº·c Ä‘á»‹nh 30fps)
    total_seconds = 0
    for scene in data.get('scenes', []):
        if 'totalDurationSeconds' in scene:
            total_seconds += scene['totalDurationSeconds']
        elif 'shots' in scene:
            total_seconds += sum(shot.get('durationSeconds', 5) for shot in scene['shots'])
            
    total_frames = max(math.ceil(total_seconds * 30), 30)
    print(f"â±ï¸ Tá»•ng thá»i lÆ°á»£ng: {total_seconds}s ({total_frames} frames)")
    
    # 2. Táº¡o props file (trÃ¡nh lá»—i escape string trÃªn Windows)
    props_file = "_audit_props.json"
    with open(props_file, 'w', encoding='utf-8') as f:
        json.dump({"scriptFile": f"compiled_{episode_id}.json"}, f)
        
    # 3. Táº¡o thÆ° má»¥c chá»©a áº£nh
    out_dir = f"out/audit_{episode_id}"
    os.makedirs(out_dir, exist_ok=True)
    
    # 4. TrÃ­ch xuáº¥t 4 frames ráº£i Ä‘á»u kháº¯p video
    # TrÃ¡nh frame 0 vÃ¬ Ä‘Ã´i khi bá»‹ Ä‘en do transition_in
    target_frames = [
        30,                                  # GiÃ¢y thá»© 1
        math.floor(total_frames * 0.3),      # 30% video
        math.floor(total_frames * 0.6),      # 60% video
        math.floor(total_frames * 0.9)       # 90% video
    ]
    
    # Gá»i Remotion Still
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    extracted_files = []
    
    for i, frame in enumerate(target_frames):
        out_file = f"{out_dir}/frame_{i+1}_f{frame}.png"
        print(f"ðŸ“¸ Äang chá»¥p frame {frame} -> {out_file}...")
        
        cmd = [
            npx_cmd, "echo", "remotion-still-deprecated", "(deprecated)", "AIStoryCompiler", 
            out_file, 
            f"--props={props_file}", 
            f"--frame={frame}",
            "--port=3005"  # TrÃ¡nh Ä‘á»¥ng port 3002 cá»§a Studio
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            extracted_files.append(out_file)
            print("âœ… OK")
        except subprocess.CalledProcessError as e:
            print(f"âŒ Lá»—i khi chá»¥p frame {frame}: {e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)}")
            
    # Cleanup
    if os.path.exists(props_file):
        os.remove(props_file)
        
    print(f"\nðŸŽ‰ ÄÃ£ trÃ­ch xuáº¥t xong {len(extracted_files)} frames. Sáºµn sÃ ng cho AI Audit!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TrÃ­ch xuáº¥t frames Ä‘á»ƒ AI Audit")
    parser.add_argument("episode_id", help="Episode ID")
    args = parser.parse_args()
    extract_frames(args.episode_id)
