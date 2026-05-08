# scripts/check_station_1.py
import sys
import os
import importlib
# Thêm đường dẫn gốc của dự án vào sys.path để Python tìm thấy module 'src'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

_db = importlib.import_module('src.db.database')
SessionLocal = _db.SessionLocal

_schema = importlib.import_module('src.db.schema')
Episode = _schema.Episode

db = SessionLocal()
# Lấy tập phim ID = 1 vừa chạy
episode = db.query(Episode).filter(Episode.id == 1).first()

if episode and episode.script_content:
    print(f"\n--- KỊCH BẢN TẬP: {episode.title} ---")
    print(episode.script_content)
else:
    print("❌ Không tìm thấy kịch bản đã viết lại (script_content) trong DB.")
db.close()
