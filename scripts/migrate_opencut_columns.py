#!/usr/bin/env python3
"""Di trú pipeline sang OpenCut-AI: thêm cột opencut_transition và opencut_effects.

Tạo 2 cột JSON mới trong bảng storyboards để lưu dữ liệu OpenCut-native
trực tiếp từ S5 Visual Director.

Usage:
    python scripts/migrate_opencut_columns.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import engine  # noqa: E402


def migrate():
    """Thêm cột opencut_transition và opencut_effects bằng raw SQL.

    Dùng ALTER TABLE thay vì create_all để không ảnh hưởng dữ liệu hiện có.
    Nếu cột đã tồn tại, SQLite báo lỗi — ta bắt và bỏ qua.
    """
    columns_to_add = [
        ("opencut_transition", "TEXT"),
        ("opencut_effects", "TEXT"),
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(
                    conn.text(
                        f"ALTER TABLE storyboards ADD COLUMN {col_name} {col_type}"
                    )
                )
                conn.commit()
                print(f"[MIGRATION] Column '{col_name}' added successfully.")
            except Exception as e:
                # Column already exists → idempotent, skip silently
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"[MIGRATION] Column '{col_name}' already exists — skipped.")
                else:
                    print(f"[MIGRATION] Error adding '{col_name}': {e}")
                    raise

    print("[MIGRATION] opencut_transition + opencut_effects migration complete.")


if __name__ == "__main__":
    migrate()
