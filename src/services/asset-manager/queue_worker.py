"""Queue Worker Orchestrator — polls AssetQueue and dispatches jobs.

Phase 2 (Issue #149): Core orchestrator with mock generators.
Phase 3/4 will inject real generators via GENERATOR_REGISTRY.

Usage:
    from src.db.database import SessionLocal
    from src.services.asset_manager.queue_worker import process_queue

    session = SessionLocal()
    processed = process_queue(session, batch_size=10)
    session.close()

Architecture:
    1. Poll PENDING tasks from AssetQueue (priority DESC, created_at ASC)
    2. Dedup check: skip if hash_key already has READY entry
    3. Route to type-specific generator via GENERATOR_REGISTRY
    4. Manage status lifecycle: PENDING → PROCESSING → READY / FAILED
    5. Retry up to MAX_RETRIES before permanent FAILED
"""

import sys
import os
import importlib.util as _iu
import logging
from datetime import datetime

# Ensure project root is on path for src.db.schema imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from src.db.schema import AssetQueue  # noqa: E402

logger = logging.getLogger("queue_worker")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_RETRIES = 3

# ---------------------------------------------------------------------------
# GENERATOR REGISTRY (Dependency Injection — Phase 2: Mock → Phase 3: Real)
# ---------------------------------------------------------------------------
# Generator signature: def generator(asset_type, prompt, hash_key) -> str | None
# Returns result_asset_id on success, None on failure.

# Phase 3: Real ElevenLabs audio generator
_gpath = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "elevenlabs_generator.py"
)
_gspec = _iu.spec_from_file_location("elevenlabs_generator", _gpath)  # noqa: E402
_eg = _iu.module_from_spec(_gspec)  # noqa: E402
_gspec.loader.exec_module(_eg)  # noqa: E402
_audio_gen = _eg.generator  # real SFX/BGM generator

# Phase 4: Real Google Imagen visual generator
_vgpath = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "visual_generator.py"
)
_vgspec = _iu.spec_from_file_location("visual_generator", _vgpath)  # noqa: E402
_vg = _iu.module_from_spec(_vgspec)  # noqa: E402
_vgspec.loader.exec_module(_vg)  # noqa: E402
_visual_gen = _vg.generator  # real background/expression generator


def _mock_generator(asset_type, prompt, hash_key):
    """Mock generator — returns a dummy asset ID for Phase 2 testing."""
    return f"mock_{asset_type}_{hash_key[:8]}"


# Default registry maps known asset types to generators
GENERATOR_REGISTRY = {
    "background": _visual_gen,
    "character_pose": _mock_generator,
    "expression": _visual_gen,
    "item": _mock_generator,
    "sound_effect": _audio_gen,
    "sfx": _audio_gen,
    "bgm": _audio_gen,
}


# ---------------------------------------------------------------------------
# Core Orchestrator
# ---------------------------------------------------------------------------

def process_queue(db_session, batch_size=10, generator_registry=None):
    """Poll PENDING tasks from AssetQueue and process them.

    Args:
        db_session: SQLAlchemy session (injected)
        batch_size: Max tasks to process in one call (default 10)
        generator_registry: Dict mapping asset_type -> generator function
                            (optional, defaults to GENERATOR_REGISTRY)

    Returns:
        List of processed task IDs (set to READY or FAILED).
    """
    # Query PENDING tasks sorted by priority DESC, created_at ASC
    pending_tasks = (
        db_session.query(AssetQueue)
        .filter(AssetQueue.status == "PENDING")
        .order_by(AssetQueue.priority.desc(), AssetQueue.created_at.asc())
        .limit(batch_size)
        .all()
    )

    registry = generator_registry if generator_registry is not None else GENERATOR_REGISTRY
    processed_ids = []

    for task in pending_tasks:
        # AC4: Set status to PROCESSING immediately on pickup
        task.status = "PROCESSING"
        task.updated_at = datetime.utcnow()
        db_session.commit()

        # AC2: Hash dedup — check if hash_key already has READY entry
        existing_ready = (
            db_session.query(AssetQueue)
            .filter(
                AssetQueue.hash_key == task.hash_key,
                AssetQueue.status == "READY",
                AssetQueue.id != task.id,
            )
            .first()
        )
        if existing_ready:
            task.result_asset_id = existing_ready.result_asset_id
            task.status = "READY"
            task.updated_at = datetime.utcnow()
            db_session.commit()
            processed_ids.append(task.id)
            logger.info(
                f"Task {task.id}: dedup → READY "
                f"(copied result_asset_id from {existing_ready.id})"
            )
            continue

        # AC3: Type-based routing via generator registry
        generator = registry.get(task.asset_type)
        if generator is None:
            task.status = "FAILED"
            task.error_msg = f"No generator registered for asset_type: {task.asset_type}"
            task.updated_at = datetime.utcnow()
            db_session.commit()
            logger.error(f"Task {task.id}: {task.error_msg}")
            processed_ids.append(task.id)
            continue

        # Call generator with retry logic
        try:
            result_asset_id = generator(task.asset_type, task.prompt, task.hash_key)
            task.result_asset_id = result_asset_id
            task.status = "READY"
            task.updated_at = datetime.utcnow()
            db_session.commit()
            processed_ids.append(task.id)
            logger.info(
                f"Task {task.id}: READY — result_asset_id={result_asset_id}"
            )
        except Exception as e:
            # Retry logic
            task.error_msg = str(e)
            task.retry_count += 1
            if task.retry_count < MAX_RETRIES:
                task.status = "PENDING"  # Back to queue for retry
                logger.warning(
                    f"Task {task.id} failed "
                    f"(attempt {task.retry_count}/{MAX_RETRIES}): {e}"
                )
            else:
                task.status = "FAILED"
                logger.error(
                    f"Task {task.id} permanently failed "
                    f"after {MAX_RETRIES} attempts: {e}"
                )
            task.updated_at = datetime.utcnow()
            db_session.commit()
            processed_ids.append(task.id)

    return processed_ids
