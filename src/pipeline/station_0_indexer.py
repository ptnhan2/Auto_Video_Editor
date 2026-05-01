import os
import sys
import shutil
import subprocess
import logging

# Logging configuration
logger = logging.getLogger("indexer")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(handler)

def _resolve_npx():
    npx_names = ["npx.cmd", "npx"] if sys.platform == "win32" else ["npx"]
    for name in npx_names:
        path = shutil.which(name)
        if path:
            return path
    return None

def run_indexer():
    logger.info("🗂️  Bắt đầu Trạm 0 (The Indexer) - Kiến trúc V2")
    logger.info("⏳ Đang quét tài nguyên và đồng bộ hóa Asset Registry...")

    npx_path = _resolve_npx()
    if not npx_path:
        logger.warning("⚠️  Không tìm thấy npx trong PATH. Bỏ qua asset registry sync.")
        logger.warning("   Cài đặt Node.js để bật tính năng quét tài nguyên tự động.")
        return True

    try:
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

if __name__ == "__main__":
    run_indexer()