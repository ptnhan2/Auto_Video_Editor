import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.db.database import engine  # noqa: E402
from sqlalchemy import text  # noqa: E402

def migrate():
    with engine.connect() as conn:
        # Check if storyboards table exists at all (SQLAlchemy model __tablename__)
        table_check = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='storyboards'")
        ).fetchone()
        if not table_check:
            print("[MIGRATION] storyboards table does not exist yet, skipping")
            return

        result = conn.execute(text("PRAGMA table_info(storyboards)"))
        columns = [row[1] for row in result]
        if 'character_position' not in columns:
            conn.execute(text(
                "ALTER TABLE storyboards ADD COLUMN character_position TEXT"
            ))
            conn.commit()
            print("[MIGRATION] Added character_position column to storyboards")
        else:
            print("[MIGRATION] character_position column already exists, skipping")

if __name__ == "__main__":
    migrate()
