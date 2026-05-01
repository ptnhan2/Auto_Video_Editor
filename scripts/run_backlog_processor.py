import sys
import os
import importlib.util

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_module_path = os.path.join(_root, "src", "services", "asset-manager", "process_assets_backlog.py")

spec = importlib.util.spec_from_file_location("process_assets_backlog", _module_path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

if __name__ == "__main__":
    mod.process_backlog()