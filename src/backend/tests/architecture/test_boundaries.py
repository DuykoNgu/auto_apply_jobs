import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def test_import_contracts_hold() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "importlinter.cli"],
        cwd=BACKEND_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout
