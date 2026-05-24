#!/usr/bin/env python3
"""
Migration script for AssetQueue table — Issue #148 Phase 1.

Creates the asset_queue table via Base.metadata.create_all().
This is safe: SQLAlchemy's create_all only creates tables that don't
already exist, so running this multiple times is idempotent and will
not break existing data.

Usage:
    python scripts/migrate_asset_queue.py
"""
import sys
import os

# Add project root to path so src.db imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import engine, Base  # noqa: E402


def migrate():
    """Create asset_queue table if it doesn't exist."""
    # Import schema to register AssetQueue model with Base.metadata
    import src.db.schema as _  # noqa: F401

    asset_queue_table = Base.metadata.tables.get("asset_queue")
    if asset_queue_table is None:
        print("[MIGRATION] ERROR: asset_queue table not found in metadata")
        sys.exit(1)

    # Create only the asset_queue table — safe for existing data
    Base.metadata.create_all(bind=engine, tables=[asset_queue_table])
    print("[MIGRATION] asset_queue table created (or already exists)")


if __name__ == "__main__":
    migrate()
