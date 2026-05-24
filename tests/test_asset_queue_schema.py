"""Tests for AssetQueue schema and migration — Issue #148 Phase 1.

Verifies:
- AC1: asset_queue table is created by Base.metadata.create_all()
- AC1: All required columns (id, asset_type, prompt, hash_key, status, result_asset_id)
- AC1: status defaults to 'PENDING'
- ULID id generation
"""
import sys
import os
import hashlib

# Ensure project root is on path so src.db imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from sqlalchemy import create_engine, inspect  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures — in-memory SQLite per test function
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def fresh_engine():
    """Create a fresh in-memory SQLite engine for each test."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def initialized_engine(fresh_engine):
    """Engine with all Base.metadata tables created."""
    from src.db.schema import Base
    Base.metadata.create_all(bind=fresh_engine)
    return fresh_engine


# ---------------------------------------------------------------------------
# AC1: Table existence
# ---------------------------------------------------------------------------

def test_asset_queue_table_exists(initialized_engine):
    """AC1: asset_queue table is created by Base.metadata.create_all()."""
    inspector = inspect(initialized_engine)
    table_names = inspector.get_table_names()
    assert "asset_queue" in table_names, (
        f"Expected 'asset_queue' in tables, got: {table_names}"
    )


# ---------------------------------------------------------------------------
# AC1: Column schema
# ---------------------------------------------------------------------------

def test_asset_queue_required_columns(initialized_engine):
    """AC1: AssetQueue has all required columns defined in Issue #148."""
    inspector = inspect(initialized_engine)
    columns = {col["name"] for col in inspector.get_columns("asset_queue")}

    required = {
        "id", "asset_type", "prompt", "hash_key",
        "status", "result_asset_id",
        # Standard project timestamps
        "created_at", "updated_at",
    }

    missing = required - columns
    assert not missing, f"Missing columns: {missing}"


def test_asset_queue_support_columns(initialized_engine):
    """Support columns for queue lifecycle (priority, error_msg, retry_count)."""
    inspector = inspect(initialized_engine)
    columns = {col["name"] for col in inspector.get_columns("asset_queue")}

    support = {"priority", "error_msg", "retry_count"}
    missing = support - columns
    assert not missing, f"Missing support columns: {missing}"


# ---------------------------------------------------------------------------
# AC1: Status default
# ---------------------------------------------------------------------------

def test_asset_queue_status_defaults_to_pending(initialized_engine):
    """AC1: status column defaults to 'PENDING' without explicit value."""
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    session = SessionLocal()
    try:
        entry = AssetQueue(
            asset_type="background",
            prompt="A scenic mountain landscape",
            hash_key=hashlib.md5(b"test_default_status").hexdigest(),
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)

        assert entry.status == "PENDING", (
            f"Expected 'PENDING', got '{entry.status}'"
        )
    finally:
        session.close()


# ---------------------------------------------------------------------------
# ULID id generation
# ---------------------------------------------------------------------------

def test_asset_queue_id_is_ulid(initialized_engine):
    """id column auto-generates a ULID (hex string, length >= 22)."""
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    session = SessionLocal()
    try:
        entry = AssetQueue(
            asset_type="character_pose",
            prompt="A character pose",
            hash_key=hashlib.md5(b"test_ulid").hexdigest(),
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)

        assert entry.id is not None, "id should be auto-generated"
        assert isinstance(entry.id, str), f"id should be str, got {type(entry.id)}"
        assert len(entry.id) >= 22, f"ULID should be at least 22 chars, got {len(entry.id)}"
        # ULID is hex characters only
        assert all(c in "0123456789abcdef" for c in entry.id), (
            f"id should be hex, got: {entry.id}"
        )
    finally:
        session.close()
