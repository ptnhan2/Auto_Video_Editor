#!/usr/bin/env python3
"""
Asset Queue Worker — Issue #149 Phase 2.

Thin CLI entry point that runs an infinite polling loop calling
process_queue() from queue_worker.py. This worker runs independently
of the script generation pipeline.

Usage:
    python scripts/run_asset_worker.py
    python scripts/run_asset_worker.py --batch-size 5 --interval 30

Press CTRL+C to stop gracefully.
"""

import sys
import os
import time
import signal
import importlib.util

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Project root
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load queue_worker module by file path (asset-manager dir has hyphen)
_worker_path = os.path.join(
    _root, "src", "services", "asset-manager", "queue_worker.py"
)
_spec = importlib.util.spec_from_file_location("queue_worker", _worker_path)
worker = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(worker)

# Add project root to path for src.db imports
sys.path.insert(0, _root)
from src.db.database import SessionLocal  # noqa: E402


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    """Parse minimal CLI arguments for batch_size and polling interval."""
    batch_size = 10
    interval = 5  # seconds

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--batch-size" and i + 1 < len(args):
            batch_size = int(args[i + 1])
            i += 2
        elif args[i] == "--interval" and i + 1 < len(args):
            interval = int(args[i + 1])
            i += 2
        else:
            print(f"Unknown argument: {args[i]}")
            print("Usage: python scripts/run_asset_worker.py [--batch-size N] [--interval S]")
            sys.exit(1)

    return batch_size, interval


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

_shutdown = False


def _handle_shutdown(signum, frame):
    global _shutdown
    print("\n[WORKER] Received shutdown signal. Finishing current batch...")
    _shutdown = True


signal.signal(signal.SIGINT, _handle_shutdown)
signal.signal(signal.SIGTERM, _handle_shutdown)


if __name__ == "__main__":
    batch_size, interval = parse_args()

    print(f"[WORKER] Starting queue worker (batch_size={batch_size}, interval={interval}s)")
    print("[WORKER] Press CTRL+C to stop")

    db = SessionLocal()
    try:
        while not _shutdown:
            try:
                processed = worker.process_queue(db, batch_size=batch_size)
                if processed:
                    print(f"[WORKER] Processed {len(processed)} tasks: {processed}")
            except Exception as e:
                print(f"[WORKER] Error in process_queue: {e}")
                db.rollback()

            time.sleep(interval)
    finally:
        db.close()
        print("[WORKER] Shut down.")
