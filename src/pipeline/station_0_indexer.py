import os
import subprocess
import logging
import shutil

# Logging configuration
logger = logging.getLogger("indexer")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(handler)

def run_indexer():
    logger.info("🗂️  Bắt đầu Trạm 0 (The Indexer) - Kiến trúc V2")
    logger.info("⏳ Đang quét tài nguyên và đồng bộ hóa Asset Registry...")
    
    try:
        # Tìm đường dẫn đầy đủ của npx (đặc biệt quan trọng trên Windows)
        npx_path = shutil.which("npx")
        
        if not npx_path:
            logger.warning("⚠️ Cảnh báo: Không tìm thấy lệnh 'npx'. Bỏ qua đồng bộ Asset Registry.")
            return True

        # Gọi script TypeScript để thực hiện quét file thực tế
        result = subprocess.run(
            [npx_path, "tsx", "src/services/asset-manager/sync_registry.ts"],
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.stdout:
            print(result.stdout.strip())
            
        logger.info("✅ Trạm 0 hoàn tất! File asset_registry.json đã sẵn sàng cho RAG Search.")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Lỗi khi chạy Indexer: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Lỗi không xác định khi chạy Indexer: {e}")
        return False

if __name__ == "__main__":
    run_indexer()