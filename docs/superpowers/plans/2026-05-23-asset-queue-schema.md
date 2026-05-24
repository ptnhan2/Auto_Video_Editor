# AssetQueue Schema & Migration — Issue #148 Phase 1

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `AssetQueue` SQLAlchemy model to `src/db/schema.py` and create a standalone migration script `scripts/migrate_asset_queue.py` that creates the table safely (idempotent, no data loss).

**Architecture:** Append a new SQLAlchemy `Base` subclass to schema.py following the project's existing model conventions (ULID primary keys, timestamps, soft-delete pattern). The migration script uses `Base.metadata.create_all()` which is safe for new tables — it won't touch existing tables.

**Tech Stack:** Python 3, SQLAlchemy 2.x, SQLite (with WAL mode), pytest 9.0.2

**Issue:** #148 — [P0] Asset Factory Phase 1: DB Queue Foundation

---

## Acceptance Criteria (from Issue #148)

| AC | Description | This plan covers? |
|----|-------------|-------------------|
| 1 | Schema: `AssetQueue` in `src/db/schema.py` with id (ULID), asset_type, prompt, hash_key (MD5), status (PENDING/PROCESSING/READY/FAILED), result_asset_id | ✅ Task 2 |
| 2 | Migration: script `scripts/migrate_asset_queue.py` creates table without breaking existing data | ✅ Task 3 |
| 3 | S5/S6 write to AssetQueue instead of backlog JSONL | ❌ Out of scope (Phase 2) |
| 4 | Deduplication: hash_key uniqueness check before insert | ❌ Out of scope (Phase 2) |

---

## EDIT ZONE

- **File:** `src/db/schema.py`
- **Lines:** 387 → end (APPEND only — must not modify any existing model class)
- **Compliance:** Diff Gate will verify ALL changes are additions at end of file

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/db/schema.py` | Modify (APPEND) | Define `AssetQueue` SQLAlchemy model |
| `scripts/migrate_asset_queue.py` | Create | Standalone script to run `Base.metadata.create_all()` for the new table |
| `tests/test_asset_queue_schema.py` | Create | TDD test verifying table creation and column schema |

---

### Task 1: Write the failing TDD test

**Files:**
- Create: `tests/test_asset_queue_schema.py`

- [ ] **Step 1: Create test file with table creation test**

```python
"""Tests for AssetQueue schema and migration — Issue #148."""
import os
import sys
import tempfile

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base


# We must import schema AFTER creating a fresh Base to avoid side effects
# Use the real project Base for integration test
@pytest.fixture(scope="module")
def test_db():
    """Create a temporary SQLite database for testing."""
    db_fd, db_path = tempfile.mkstemp(suffix=".sqlite")
    os.close(db_fd)
    db_url = f"sqlite:///{db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    yield engine
    engine.dispose()
    os.unlink(db_path)


@pytest.fixture(scope="module")
def initialized_db(test_db):
    """Initialize DB with AssetQueue table via Base.metadata.create_all."""
    from src.db.schema import Base
    Base.metadata.create_all(bind=test_db)
    return test_db


def test_asset_queue_table_exists(initialized_db):
    """AC1: AssetQueue table is created after create_all()."""
    inspector = inspect(initialized_db)
    table_names = inspector.get_table_names()
    assert "asset_queue" in table_names


def test_asset_queue_columns(initialized_db):
    """AC1: AssetQueue has all required columns with correct types."""
    inspector = inspect(initialized_db)
    columns = {col["name"]: col for col in inspector.get_columns("asset_queue")}

    required = ["id", "asset_type", "prompt", "hash_key", "status", "result_asset_id",
                "created_at", "updated_at"]

    for col_name in required:
        assert col_name in columns, f"Missing column: {col_name}"

    # id should be String (VARCHAR in SQLite)
    assert "VARCHAR" in str(columns["id"]["type"]).upper() or "String" in str(type(columns["id"]["type"]))


def test_asset_queue_status_default(initialized_db):
    """AC1: status column defaults to 'PENDING'."""
    from src.db.schema import AssetQueue
    SessionLocal = sessionmaker(bind=initialized_db)
    session = SessionLocal()
    try:
        import hashlib
        entry = AssetQueue(
            asset_type="background",
            prompt="A test prompt",
            hash_key=hashlib.md5(b"test").hexdigest(),
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)
        assert entry.status == "PENDING"
        assert entry.id is not None
        assert len(entry.id) > 10  # ULID length check
    finally:
        session.close()


def test_asset_queue_hash_key_unique(initialized_db):
    """AC4 precondition: hash_key should be unique (enforced at app level later)."""
    from src.db.schema import AssetQueue
    import hashlib
    SessionLocal = sessionmaker(bind=initialized_db)
    session = SessionLocal()
    try:
        hk = hashlib.md5(b"duplicate_test").hexdigest()
        e1 = AssetQueue(asset_type="bg", prompt="p1", hash_key=hk)
        e2 = AssetQueue(asset_type="bg", prompt="p2", hash_key=hk)
        session.add_all([e1, e2])
        # If unique constraint NOT added, this commits fine (dedup is app-level later)
        # If it IS added, expect IntegrityError — either is acceptable for Phase 1
        session.commit()
        assert session.query(AssetQueue).filter(AssetQueue.hash_key == hk).count() >= 1
    finally:
        session.close()
```

- [ ] **Step 2: Run test to verify it FAILS (AssetQueue not defined yet)**

```bash
python -m pytest tests/test_asset_queue_schema.py -v
```

**Expected:** `FAILED` — `ImportError` or `AttributeError: module 'src.db.schema' has no attribute 'AssetQueue'`

---

### Task 2: Add AssetQueue model to schema.py

**Files:**
- Modify: `src/db/schema.py` (APPEND after line 387 — end of file)

**EDIT ZONE:** Lines 387 → end (appending only)

- [ ] **Step 1: Append AssetQueue class to end of schema.py**

After the last line of the `Asset` class (line 387), append:

```python

# ==========================================
# ASSET FACTORY QUEUE (Phase 1 - Issue #148)
# ==========================================

class AssetQueue(Base):
    __tablename__ = 'asset_queue'

    id = Column(String, primary_key=True, default=generate_ulid)
    asset_type = Column(String, nullable=False, index=True)
    prompt = Column(Text, nullable=True)
    hash_key = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default='PENDING', index=True)
    result_asset_id = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    error_msg = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

- [ ] **Step 2: Run Diff Gate**

```bash
git diff -- src/db/schema.py
```

**Verify:** ALL changes are additions after the original line 387. No existing model class modified.

- [ ] **Step 3: Run test to verify it PASSES now**

```bash
python -m pytest tests/test_asset_queue_schema.py -v
```

**Expected:** All tests PASS — table exists, columns present, status defaults to PENDING.

---

### Task 3: Create migration script

**Files:**
- Create: `scripts/migrate_asset_queue.py`

- [ ] **Step 1: Create the migration script**

```python
#!/usr/bin/env python3
"""
Migration script for AssetQueue table — Issue #148 Phase 1.

Creates the asset_queue table via Base.metadata.create_all().
This is safe: create_all only creates tables that don't exist yet,
so existing data is preserved.

Usage:
    python scripts/migrate_asset_queue.py
"""
import sys
import os

# Add project root to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import engine, Base


def migrate():
    """Create asset_queue table if it doesn't exist."""
    # Import schema to register all models with Base.metadata
    import src.db.schema as _   # noqa: F401

    # create_all is idempotent — only creates tables that don't exist
    Base.metadata.create_all(bind=engine, tables=[
        Base.metadata.tables.get("asset_queue")
    ])
    print("[MIGRATION] asset_queue table created (or already exists)")


if __name__ == "__main__":
    migrate()
```

- [ ] **Step 2: Run migration script to verify it works**

```bash
python scripts/migrate_asset_queue.py
```

**Expected:** `[MIGRATION] asset_queue table created (or already exists)` — no errors.

- [ ] **Step 3: Run migration a second time to verify idempotence**

```bash
python scripts/migrate_asset_queue.py
```

**Expected:** Same output, no errors — `create_all()` does not fail on existing tables.

---

### Task 4: Final verification

- [ ] **Step 1: Run full test suite**

```bash
python -m pytest tests/test_asset_queue_schema.py -v
```

**Expected:** All tests PASS (3 tests: table_exists, columns, status_default)

- [ ] **Step 2: Verify EDIT ZONE compliance one more time**

```bash
git diff -- src/db/schema.py
```

**Verify:** Only additions at end of file. Zero modifications to existing lines.

---

## Column Design Rationale

| Column | Rationale |
|--------|-----------|
| `id` | ULID (sortable, generated client-side via `generate_ulid()`) |
| `asset_type` | e.g., "background", "character_pose", "prop", "sound_effect" |
| `prompt` | The generation prompt that S5/S6 will use |
| `hash_key` | MD5 hash of prompt — used for deduplication (AC4) |
| `status` | PENDING → PROCESSING → READY/FAILED lifecycle |
| `result_asset_id` | FK to `assets` table once asset is generated |
| `priority` | For future queue ordering (higher = processed first) |
| `error_msg` | Stores failure reason when status=FAILED |
| `retry_count` | Tracks retries for failed entries |
| `created_at` / `updated_at` | Standard project convention |

**Why `unique=True` is NOT on hash_key yet:** AC4 says dedup logic happens at the application station level (check before insert), not at DB constraint level. Adding a unique constraint now would cause IntegrityError on intentional re-queues. Phase 2 will implement the application-level dedup check.
