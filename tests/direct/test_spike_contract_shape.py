from pathlib import Path


CONTRACTS = Path(__file__).parents[2] / "contracts"
PINNED_RUNNER = "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6"


def test_spike_contracts_use_the_current_pinned_runner():
    for path in CONTRACTS.glob("*.py"):
        first_line = path.read_text(encoding="utf-8").splitlines()[0]
        assert PINNED_RUNNER in first_line
        assert "py-genlayer:test" not in path.read_text(encoding="utf-8")
        assert "py-genlayer:latest" not in path.read_text(encoding="utf-8")
