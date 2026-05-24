"""Unit tests for report_missing_asset — Issue #153.

Verifies:
- AC1: report_missing_asset inserts an AssetQueue row with status='PENDING'
- AC2: hash_key = md5(asset_type + description)
- AC3: Existing logic unchanged — function signature preserved
"""
import sys
import os
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
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
# AC1: report_missing_asset inserts into AssetQueue with status='PENDING'
# ---------------------------------------------------------------------------

def test_report_missing_asset_inserts_pending_record(initialized_engine, monkeypatch):
    """AC1: Calling report_missing_asset creates an AssetQueue row with status='PENDING'."""
    from src.pipeline import station_5_visual_director as s5
    from src.db.schema import AssetQueue

    # Point SessionLocal to our in-memory engine
    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s5, "SessionLocal", lambda: SessionLocal())

    result = s5.report_missing_asset(
        storyboard_id="shot_001",
        asset_type="Action",
        description="epic jump animation",
        suggested_id="auto_action_shot_001",
    )

    assert result["status"] == "reported"
    assert result["queued"] is True
    assert "hash_key" in result

    # Verify the record was actually inserted
    session = SessionLocal()
    try:
        rows = session.query(AssetQueue).all()
        assert len(rows) == 1, f"Expected 1 row, got {len(rows)}"

        row = rows[0]
        assert row.asset_type == "Action"
        assert row.prompt == "epic jump animation"
        assert row.status == "PENDING"
        assert row.id is not None
    finally:
        session.close()


# ---------------------------------------------------------------------------
# AC2: hash_key = md5(asset_type + prompt)
# ---------------------------------------------------------------------------

def test_report_missing_asset_hash_key_computation(initialized_engine, monkeypatch):
    """AC2: hash_key is md5(asset_type + description) for dedup in Phase 2."""
    from src.pipeline import station_5_visual_director as s5
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s5, "SessionLocal", lambda: SessionLocal())

    asset_type = "Expression"
    description = "surprised face"

    expected_hash = hashlib.md5(f"{asset_type}{description}".encode()).hexdigest()

    result = s5.report_missing_asset(
        storyboard_id="shot_002",
        asset_type=asset_type,
        description=description,
        suggested_id="auto_expr_shot_002",
    )

    assert result["hash_key"] == expected_hash, (
        f"hash_key mismatch: {result['hash_key']} != {expected_hash}"
    )

    # Also verify the DB record stores the correct hash_key
    session = SessionLocal()
    try:
        row = session.query(AssetQueue).first()
        assert row.hash_key == expected_hash
    finally:
        session.close()


# ---------------------------------------------------------------------------
# AC3: Same hash_key for same (asset_type, prompt) → dedup-ready
# ---------------------------------------------------------------------------

def test_report_missing_asset_consistent_hash_for_same_input(initialized_engine, monkeypatch):
    """AC2 (dedup): Same (asset_type, prompt) produces the same hash_key."""
    from src.pipeline import station_5_visual_director as s5

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s5, "SessionLocal", lambda: SessionLocal())

    r1 = s5.report_missing_asset("s1", "Background", "forest", "auto_bg_s1")
    r2 = s5.report_missing_asset("s2", "Background", "forest", "auto_bg_s2")

    assert r1["hash_key"] == r2["hash_key"], (
        "Same asset_type + prompt must produce same hash_key for dedup"
    )


def test_report_missing_asset_different_hash_for_different_input(initialized_engine, monkeypatch):
    """AC2: Different input produces different hash_key."""
    from src.pipeline import station_5_visual_director as s5

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s5, "SessionLocal", lambda: SessionLocal())

    r1 = s5.report_missing_asset("s1", "Action", "jump", "auto_1")
    r2 = s5.report_missing_asset("s2", "Action", "run", "auto_2")

    assert r1["hash_key"] != r2["hash_key"], (
        "Different prompts must produce different hash_keys"
    )


# ---------------------------------------------------------------------------
# Error handling: graceful return on DB failure
# ---------------------------------------------------------------------------

def test_report_missing_asset_handles_db_error(monkeypatch):
    """report_missing_asset returns error status on DB failure, no crash."""
    from src.pipeline import station_5_visual_director as s5

    # Provide a session that raises on commit
    class FakeSession:
        def add(self, entry):
            pass
        def commit(self):
            raise RuntimeError("DB down")
        def rollback(self):
            pass
        def close(self):
            pass

    mock_session = FakeSession()

    monkeypatch.setattr(s5, "SessionLocal", lambda: mock_session)

    result = s5.report_missing_asset("s1", "Action", "jump", "auto_1")
    assert result["status"] == "error"
    assert "DB down" in result["message"]


# ---------------------------------------------------------------------------
# AC3: Function signature unchanged → backward compatible
# ---------------------------------------------------------------------------

def test_report_missing_asset_signature_unchanged(initialized_engine, monkeypatch):
    """AC3: The function signature is unchanged — callers don't need updates."""
    from src.pipeline import station_5_visual_director as s5
    import inspect

    sig = inspect.signature(s5.report_missing_asset)
    params = list(sig.parameters.keys())
    assert params == ["storyboard_id", "asset_type", "description", "suggested_id"], (
        f"Signature changed! Got: {params}"
    )
