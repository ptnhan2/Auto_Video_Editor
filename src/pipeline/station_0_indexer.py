import os
import subprocess
import logging

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
        # Gọi script TypeScript để thực hiện quét file thực tế
        result = subprocess.run(
            ["npx", "tsx", "src/services/asset-manager/sync_registry.ts"],
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
    except FileNotFoundError:
        logger.error("❌ Lỗi: Không tìm thấy lệnh 'npx'. Vui lòng cài đặt Node.js.")
        return False

if __name__ == "__main__":
    run_indexer()