"""Unit tests for report_missing_asset in S6 — Issue #154.

Verifies:
- AC1: report_missing_asset inserts an AssetQueue row with status='PENDING'
- AC2: hash_key = md5(asset_type + description)
- AC3: Dedup: same hash_key → skip insert, return "already_queued"
- AC4: Different inputs produce different hash_keys
- AC5: Error handling: returns error status on DB failure, no crash
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
    """AC1: report_missing_asset inserts an AssetQueue row with status='PENDING'."""
    from src.pipeline import station_6_sound_vfx_engineer as s6
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    result = s6.report_missing_asset(
        storyboard_id="shot_001",
        asset_type="SFX",
        description="explosion sound",
        suggested_id="auto_sfx_shot_001",
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
        assert row.asset_type == "SFX"
        assert row.prompt == "explosion sound"
        assert row.status == "PENDING"
        assert row.id is not None
    finally:
        session.close()


# ---------------------------------------------------------------------------
# AC2: hash_key = md5(asset_type + description)
# ---------------------------------------------------------------------------

def test_report_missing_asset_hash_key_computation(initialized_engine, monkeypatch):
    """AC2: hash_key is md5(asset_type + description) for dedup."""
    from src.pipeline import station_6_sound_vfx_engineer as s6
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    asset_type = "SFX"
    description = "explosion sound"

    expected_hash = hashlib.md5(f"{asset_type}{description}".encode()).hexdigest()

    result = s6.report_missing_asset(
        storyboard_id="shot_002",
        asset_type=asset_type,
        description=description,
        suggested_id="auto_sfx_shot_002",
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
# AC3: Dedup — same hash_key → skip insert, return "already_queued"
# ---------------------------------------------------------------------------

def test_report_missing_asset_dedup_returns_already_queued(initialized_engine, monkeypatch):
    """AC3: Same (asset_type, description) twice → second call returns 'already_queued'."""
    from src.pipeline import station_6_sound_vfx_engineer as s6
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    # First call — should insert
    r1 = s6.report_missing_asset(
        storyboard_id="shot_003",
        asset_type="VFX",
        description="fire effect",
        suggested_id="auto_vfx_shot_003",
    )
    assert r1["status"] == "reported"
    assert r1["queued"] is True

    # Second call with same type+description — should dedup
    r2 = s6.report_missing_asset(
        storyboard_id="shot_004",
        asset_type="VFX",
        description="fire effect",
        suggested_id="auto_vfx_shot_004",
    )
    assert r2["status"] == "already_queued", (
        f"Expected 'already_queued' for duplicate, got {r2['status']}"
    )

    # Only 1 row should exist in DB
    session = SessionLocal()
    try:
        rows = session.query(AssetQueue).all()
        assert len(rows) == 1, f"Expected 1 row after dedup, got {len(rows)}"
    finally:
        session.close()


def test_report_missing_asset_dedup_different_type_not_dedupped(initialized_engine, monkeypatch):
    """AC3: Different asset_type with same description → treated as unique."""
    from src.pipeline import station_6_sound_vfx_engineer as s6
    from src.db.schema import AssetQueue

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    r1 = s6.report_missing_asset("shot_005", "SFX", "wind", "auto_sfx_005")
    r2 = s6.report_missing_asset("shot_006", "VFX", "wind", "auto_vfx_006")

    # Different types → different hash_keys → both inserted
    assert r1["status"] == "reported"
    assert r2["status"] == "reported"

    session = SessionLocal()
    try:
        rows = session.query(AssetQueue).all()
        assert len(rows) == 2, f"Expected 2 rows for different asset_types, got {len(rows)}"
    finally:
        session.close()


# ---------------------------------------------------------------------------
# AC2 (consistency): Same input → same hash, different input → different hash
# ---------------------------------------------------------------------------

def test_report_missing_asset_consistent_hash_for_same_input(initialized_engine, monkeypatch):
    """Same (asset_type, description) produces the same hash_key across different calls."""
    from src.pipeline import station_6_sound_vfx_engineer as s6

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    r1 = s6.report_missing_asset("s1", "BGM", "calm music", "auto_bgm_s1")
    r2 = s6.report_missing_asset("s2", "BGM", "calm music", "auto_bgm_s2")

    assert r1["hash_key"] == r2["hash_key"], (
        "Same asset_type + prompt must produce same hash_key for dedup"
    )


def test_report_missing_asset_different_hash_for_different_input(initialized_engine, monkeypatch):
    """Different input produces different hash_key."""
    from src.pipeline import station_6_sound_vfx_engineer as s6

    SessionLocal = sessionmaker(bind=initialized_engine)
    monkeypatch.setattr(s6, "SessionLocal", lambda: SessionLocal())

    r1 = s6.report_missing_asset("s3", "SFX", "jump", "auto_1")
    r2 = s6.report_missing_asset("s4", "SFX", "run", "auto_2")

    assert r1["hash_key"] != r2["hash_key"], (
        "Different prompts must produce different hash_keys"
    )


# ---------------------------------------------------------------------------
# AC5: Error handling — graceful return on DB failure
# ---------------------------------------------------------------------------

def test_report_missing_asset_handles_db_error(monkeypatch):
    """report_missing_asset returns error status on DB failure, no crash."""
    from src.pipeline import station_6_sound_vfx_engineer as s6

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
        def query(self, *args, **kwargs):
            return self
        def filter(self, *args, **kwargs):
            raise RuntimeError("DB down")

    mock_session = FakeSession()
    monkeypatch.setattr(s6, "SessionLocal", lambda: mock_session)

    result = s6.report_missing_asset(
        storyboard_id="shot_err",
        asset_type="SFX",
        description="crash test",
        suggested_id="auto_sfx_err",
    )

    assert result["status"] == "error"
    assert "message" in result
