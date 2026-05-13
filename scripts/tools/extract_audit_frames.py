import os
import sys
import json
import subprocess
import argparse
import math

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def extract_frames(episode_id):
    print(f"🎬 Bắt đầu trích xuất frames cho episode: {episode_id}")
    
    # 1. Đọc file JSON để lấy thông tin duration
    json_path = f"public/scripts/compiled_{episode_id}.json"
    if not os.path.exists(json_path):
        print(f"❌ Không tìm thấy file JSON: {json_path}")
        sys.exit(1)
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Tính tổng số frame (mặc định 30fps)
    total_seconds = 0
    for scene in data.get('scenes', []):
        if 'totalDurationSeconds' in scene:
            total_seconds += scene['totalDurationSeconds']
        elif 'shots' in scene:
            total_seconds += sum(shot.get('durationSeconds', 5) for shot in scene['shots'])
            
    total_frames = max(math.ceil(total_seconds * 30), 30)
    print(f"⏱️ Tổng thời lượng: {total_seconds}s ({total_frames} frames)")
    
    # 2. Tạo props file (tránh lỗi escape string trên Windows)
    props_file = "_audit_props.json"
    with open(props_file, 'w', encoding='utf-8') as f:
        json.dump({"scriptFile": f"compiled_{episode_id}.json"}, f)
        
    # 3. Tạo thư mục chứa ảnh
    out_dir = f"out/audit_{episode_id}"
    os.makedirs(out_dir, exist_ok=True)
    
    # 4. Trích xuất 4 frames rải đều khắp video
    # Tránh frame 0 vì đôi khi bị đen do transition_in
    target_frames = [
        30,                                  # Giây thứ 1
        math.floor(total_frames * 0.3),      # 30% video
        math.floor(total_frames * 0.6),      # 60% video
        math.floor(total_frames * 0.9)       # 90% video
    ]
    
    # Gọi Remotion Still
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    extracted_files = []
    
    for i, frame in enumerate(target_frames):
        out_file = f"{out_dir}/frame_{i+1}_f{frame}.png"
        print(f"📸 Đang chụp frame {frame} -> {out_file}...")
        
        cmd = [
            npx_cmd, "remotion", "still", "remotion/index.ts", "AIStoryCompiler", 
            out_file, 
            f"--props={props_file}", 
            f"--frame={frame}",
            "--port=3005"  # Tránh đụng port 3002 của Studio
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            extracted_files.append(out_file)
            print(f"✅ OK")
        except subprocess.CalledProcessError as e:
            print(f"❌ Lỗi khi chụp frame {frame}: {e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)}")
            
    # Cleanup
    if os.path.exists(props_file):
        os.remove(props_file)
        
    print(f"\n🎉 Đã trích xuất xong {len(extracted_files)} frames. Sẵn sàng cho AI Audit!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Trích xuất frames để AI Audit")
    parser.add_argument("episode_id", help="Episode ID")
    args = parser.parse_args()
    extract_frames(args.episode_id)
