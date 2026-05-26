"""Tests for queue_worker.py — Issue #149 Phase 2.

Verifies:
- AC1: process_queue polls PENDING tasks from AssetQueue
- AC2: Hash caching dedup — skip if hash_key already READY
- AC3: Type-based routing via GENERATOR_REGISTRY
- AC4: Status lifecycle (PENDING → PROCESSING → READY)
- AC4b: Retry logic (max 3, then FAILED)
- AC5: Dependency injection (session + registry injected)
"""
import sys
import os
import hashlib
import importlib.util

# Ensure project root is on path for src.db.schema imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from unittest.mock import patch, MagicMock  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402


# ---------------------------------------------------------------------------
# Import queue_worker by file path (directory name "asset-manager" has hyphen)
# ---------------------------------------------------------------------------

def _import_queue_worker():
    """Import queue_worker module by file path — hyphen in dir name."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    worker_path = os.path.join(
        project_root, "src", "services", "asset-manager", "queue_worker.py"
    )
    spec = importlib.util.spec_from_file_location("queue_worker", worker_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def fresh_engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def initialized_engine(fresh_engine):
    from src.db.schema import Base
    Base.metadata.create_all(bind=fresh_engine)
    return fresh_engine


@pytest.fixture(scope="function")
def db_session(initialized_engine):
    SessionLocal = sessionmaker(bind=initialized_engine)
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()


@pytest.fixture(scope="function", autouse=True)
def mock_visual_genai(monkeypatch):
    """Mock google.genai.Client so queue_worker tests don't call real API.

    Since Phase 4 wires visual_generator into GENERATOR_REGISTRY for
    'background' and 'expression', queue_worker tests that use the default
    registry would fail with 'No API key configured'. This autouse fixture
    sets a dummy API key and patches google.genai.Client globally.
    """
    monkeypatch.setenv("GOOGLE_GENERATIVE_AI_API_KEY", "test-queue-worker-key")
    fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb"

    mock_image = MagicMock()
    mock_image.image_bytes = fake_jpeg
    mock_image.mime_type = "image/jpeg"

    mock_generated = MagicMock()
    mock_generated.image = mock_image

    mock_response = MagicMock()
    mock_response.generated_images = [mock_generated]

    mock_client = MagicMock()
    mock_client.models.generate_images.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client, create=True), \
         patch("google.genai.types.GenerateImagesConfig", create=True), \
         patch("google.genai.types.GenerateContentConfig", create=True):
        yield


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _make_task(session, asset_type="background", prompt="test prompt",
               hash_key=None, status="PENDING", priority=0,
               result_asset_id=None, error_msg=None, retry_count=0):
    """Insert a single AssetQueue row and return it."""
    from src.db.schema import AssetQueue
    entry = AssetQueue(
        asset_type=asset_type,
        prompt=prompt,
        hash_key=hash_key or hashlib.md5(prompt.encode()).hexdigest(),
        status=status,
        priority=priority,
        result_asset_id=result_asset_id,
        error_msg=error_msg,
        retry_count=retry_count,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


# ===========================================================================
# AC1: process_queue exists and polls PENDING tasks
# ===========================================================================

def test_process_queue_is_importable():
    """AC1: queue_worker module exports process_queue function."""
    mod = _import_queue_worker()
    assert callable(mod.process_queue)


def test_process_queue_polls_pending_only(db_session):
    """AC1: Only tasks with status='PENDING' are picked up."""
    mod = _import_queue_worker()

    pending = _make_task(db_session, asset_type="bg", prompt="p1",
                         hash_key="hash1", status="PENDING", priority=0)
    _make_task(db_session, asset_type="bg", prompt="p2",
               hash_key="hash2", status="PROCESSING", priority=0)
    _make_task(db_session, asset_type="bg", prompt="p3",
               hash_key="hash3", status="READY", priority=0)
    _make_task(db_session, asset_type="bg", prompt="p4",
               hash_key="hash4", status="FAILED", priority=0)

    processed = mod.process_queue(db_session, batch_size=10)

    assert len(processed) == 1
    assert processed[0] == pending.id


def test_process_queue_sorts_by_priority_desc(db_session):
    """AC1: Tasks sorted by priority DESC, then created_at ASC."""
    mod = _import_queue_worker()

    low = _make_task(db_session, asset_type="bg", prompt="low",
                     hash_key="h1", status="PENDING", priority=0)
    high = _make_task(db_session, asset_type="bg", prompt="high",
                      hash_key="h2", status="PENDING", priority=10)
    mid = _make_task(db_session, asset_type="bg", prompt="mid",
                     hash_key="h3", status="PENDING", priority=5)

    processed = mod.process_queue(db_session, batch_size=10)

    assert processed[0] == high.id
    assert processed[1] == mid.id
    assert processed[2] == low.id


def test_process_queue_respects_batch_size(db_session):
    """AC1: batch_size limits how many tasks are picked up."""
    mod = _import_queue_worker()

    for i in range(5):
        _make_task(db_session, asset_type="bg", prompt=f"p{i}",
                   hash_key=f"h{i}", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=3)

    assert len(processed) == 3


def test_process_queue_same_priority_sorts_by_created_at(db_session):
    """AC1: Same priority => created_at ASC (older first)."""
    mod = _import_queue_worker()

    older = _make_task(db_session, asset_type="bg", prompt="older",
                       hash_key="h1", status="PENDING", priority=5)
    newer = _make_task(db_session, asset_type="bg", prompt="newer",
                       hash_key="h2", status="PENDING", priority=5)

    processed = mod.process_queue(db_session, batch_size=10)

    assert processed[0] == older.id
    assert processed[1] == newer.id


# ===========================================================================
# AC4: Status lifecycle — PENDING → PROCESSING on pickup
# ===========================================================================

def test_process_queue_sets_processing_on_pickup(db_session):
    """AC4: Task status changes from PENDING to PROCESSING or READY after processing."""
    mod = _import_queue_worker()

    task = _make_task(db_session, asset_type="background", prompt="test",
                      hash_key="pickup", status="PENDING", priority=0)

    mod.process_queue(db_session, batch_size=10,
                      generator_registry=mod.GENERATOR_REGISTRY)

    db_session.refresh(task)
    # With mock generator, task goes PENDING → PROCESSING → READY
    assert task.status == "READY"
    assert task.result_asset_id is not None


# ===========================================================================
# AC2: Hash dedup
# ===========================================================================

def test_process_queue_dedup_skip_if_hash_ready(db_session):
    """AC2: If hash_key already has READY entry, copy result_asset_id and skip."""
    mod = _import_queue_worker()

    # Existing READY entry
    ready = _make_task(db_session, asset_type="bg", prompt="existing",
                       hash_key="dup_hash", status="READY", priority=0,
                       result_asset_id="asset_123")
    # New PENDING entry with same hash_key
    dup = _make_task(db_session, asset_type="bg", prompt="duplicate",
                     hash_key="dup_hash", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=10)

    db_session.refresh(dup)
    assert dup.status == "READY"
    assert dup.result_asset_id == "asset_123"
    assert ready.id not in processed  # The READY one wasn't "processed"
    assert dup.id in processed


def test_process_queue_dedup_no_ready_entry_no_skip(db_session):
    """AC2: If hash_key has no READY entry, task proceeds normally."""
    mod = _import_queue_worker()

    task = _make_task(db_session, asset_type="bg", prompt="test",
                      hash_key="unique_hash", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=10)

    db_session.refresh(task)
    assert task.id in processed


def test_process_queue_dedup_multiple_ready_picks_first(db_session):
    """AC2: If multiple READY for same hash_key, copy from the first found."""
    mod = _import_queue_worker()

    _make_task(db_session, asset_type="bg", prompt="r1",
               hash_key="multi_hash", status="READY", priority=0,
               result_asset_id="asset_first")
    _make_task(db_session, asset_type="bg", prompt="r2",
               hash_key="multi_hash", status="READY", priority=0,
               result_asset_id="asset_second")
    dup = _make_task(db_session, asset_type="bg", prompt="duplicate",
                     hash_key="multi_hash", status="PENDING", priority=0)

    mod.process_queue(db_session, batch_size=10)

    db_session.refresh(dup)
    assert dup.status == "READY"
    assert dup.result_asset_id == "asset_first"


# ===========================================================================
# AC3: GENERATOR_REGISTRY and mock generators
# ===========================================================================

def test_generator_registry_mock_creates_dummy_id():
    """AC3: Mock generator returns dummy ID in format mock_{type}_{hash_prefix}."""
    mod = _import_queue_worker()
    result = mod._mock_generator("background", "test prompt", "abcdef1234567890")
    assert result == "mock_background_abcdef12"


def test_process_queue_dispatches_to_generator(db_session):
    """AC3/AC4: Generator called, returns result_asset_id, status set to READY."""
    mod = _import_queue_worker()

    task = _make_task(db_session, asset_type="background", prompt="beach",
                      hash_key="beach_hash", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=10,
                                  generator_registry=mod.GENERATOR_REGISTRY)

    db_session.refresh(task)
    assert task.status == "READY"
    # Phase 4: visual generator returns hash_key[:12]
    assert task.result_asset_id == "beach_hash"
    assert task.id in processed


def test_process_queue_happy_path_multiple_tasks(db_session):
    """AC4: Multiple tasks go through full PENDING → PROCESSING → READY."""
    mod = _import_queue_worker()

    task1 = _make_task(db_session, asset_type="background", prompt="bg",
                       hash_key="h1", status="PENDING", priority=10)
    task2 = _make_task(db_session, asset_type="character_pose", prompt="cp",
                       hash_key="h2", status="PENDING", priority=5)
    task3 = _make_task(db_session, asset_type="expression", prompt="ex",
                       hash_key="h3", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=10,
                                  generator_registry=mod.GENERATOR_REGISTRY)

    db_session.refresh(task1)
    db_session.refresh(task2)
    db_session.refresh(task3)

    assert len(processed) == 3
    assert task1.status == "READY"
    assert task2.status == "READY"
    assert task3.status == "READY"
    assert task1.result_asset_id == "h1"
    assert task2.result_asset_id == "mock_character_pose_h2"
    assert task3.result_asset_id == "h3"


def test_process_queue_unknown_asset_type_fails(db_session):
    """AC4: Unknown asset_type with no generator -> FAILED."""
    mod = _import_queue_worker()

    task = _make_task(db_session, asset_type="nonexistent_type", prompt="test",
                      hash_key="h1", status="PENDING", priority=0)

    processed = mod.process_queue(db_session, batch_size=10,
                                  generator_registry=mod.GENERATOR_REGISTRY)

    db_session.refresh(task)
    assert task.status == "FAILED"
    assert "No generator registered" in task.error_msg
    assert task.id in processed


# ===========================================================================
# AC4b: Retry logic
# ===========================================================================

def test_process_queue_retry_less_than_max_resets_to_pending(db_session):
    """AC4b: If retry_count < 3 after error, status goes back to PENDING."""
    mod = _import_queue_worker()

    # Create a generator that always fails
    def failing_generator(asset_type, prompt, hash_key):
        raise RuntimeError("transient error")

    failing_registry = {"background": failing_generator}

    task = _make_task(db_session, asset_type="background", prompt="test",
                      hash_key="h1", status="PENDING", priority=0, retry_count=0)

    mod.process_queue(db_session, batch_size=10, generator_registry=failing_registry)

    db_session.refresh(task)
    assert task.status == "PENDING"
    assert task.retry_count == 1
    assert "transient error" in task.error_msg


def test_process_queue_retry_max_exceeded_sets_failed(db_session):
    """AC4b: If retry_count >= MAX_RETRIES after error, status = FAILED."""
    mod = _import_queue_worker()

    def failing_generator(asset_type, prompt, hash_key):
        raise RuntimeError("permanent error")

    failing_registry = {"background": failing_generator}

    task = _make_task(db_session, asset_type="background", prompt="test",
                      hash_key="h1", status="PENDING", priority=0,
                      retry_count=mod.MAX_RETRIES - 1)  # 2 → this attempt makes 3

    mod.process_queue(db_session, batch_size=10, generator_registry=failing_registry)

    db_session.refresh(task)
    assert task.status == "FAILED"
    assert task.retry_count == mod.MAX_RETRIES
    assert "permanent error" in task.error_msg


# ===========================================================================
# AC5: Dependency injection
# ===========================================================================

def test_process_queue_custom_registry_injection(db_session):
    """AC5: Custom generator_registry injected overrides default."""
    mod = _import_queue_worker()

    def custom_generator(asset_type, prompt, hash_key):
        return f"custom_{asset_type}_{hash_key[:4]}"

    custom_registry = {"expression": custom_generator}

    task = _make_task(db_session, asset_type="expression", prompt="test",
                      hash_key="abcdef1234567890", status="PENDING", priority=0)

    mod.process_queue(db_session, batch_size=10, generator_registry=custom_registry)

    db_session.refresh(task)
    assert task.status == "READY"
    assert task.result_asset_id == "custom_expression_abcd"
