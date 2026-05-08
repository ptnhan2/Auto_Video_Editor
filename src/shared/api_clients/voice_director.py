import os
import sys
import asyncio
import importlib

# Thêm path để import TTSManager
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
_manager = importlib.import_module('scripts.core.tts.manager')
TTSManager = _manager.TTSManager

async def main():
    # Fix for Windows console unicode issues
    sys.stdout.reconfigure(encoding='utf-8')
    
    print("🎬 Kích hoạt Voice Director Pipeline...")
    
    # Lấy đường dẫn script từ tham số dòng lệnh hoặc mặc định
    script_arg = sys.argv[1] if len(sys.argv) > 1 else "reviewed_script.json"
    script_path = os.path.join("public", "scripts", script_arg)
    
    if not os.path.exists(script_path):
        print(f"File {script_path} không tồn tại.")
        print("💡 Hãy đảm bảo bạn đã chạy quá trình AI Trích Xuất và lưu JSON vào đường dẫn trên.")
        
        # Tạo file mẫu để test
        print("Tạo mẫu kịch bản JSON test: public/scripts/reviewed_script.json")
        os.makedirs(os.path.dirname(script_path), exist_ok=True)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write("""{
              "scenes": [
                {
                  "shots": [
                    {
                      "characterId": "narrator",
                      "dialogue": "Day la tieng noi cua nguoi dan chuyen, su dung he thong AI da nen tang.",
                      "audioId": "test_narrator_001"
                    },
                    {
                      "characterId": "char_001",
                      "dialogue": "Chao ban, minh la nhan vat nu tre trung. He thong Batch Render dang hoat dong tot!",
                      "audioId": "test_char001_001"
                    }
                  ]
                }
              ]
            }""")
        print("Đã tạo file test. Đang chạy luồng Render...\n")

    # Gọi Manager
    manager = TTSManager()
    await manager.batch_render(script_path)
    
if __name__ == "__main__":
    asyncio.run(main())
