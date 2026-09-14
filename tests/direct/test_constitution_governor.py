"""Direct-mode checks for deterministic proposal guards only.

Consensus is intentionally not mocked. Approved and rejected verdicts belong
in real-provider integration tests.
"""

from pathlib import Path

import pytest


ROOT = Path(__file__).parents[2]
V2_CODE = (ROOT / "contracts" / "governed_protocol_v2.py").read_bytes()
COMMIT = "a" * 40
SOURCE_URL = (
    f"https://raw.githubusercontent.com/Habuskid/clauseroot/{COMMIT}/"
    "contracts/governed_protocol_v2.py"
)


def deploy_governor(direct_deploy, direct_alice):
    return direct_deploy("contracts/clause_root_governor.py", direct_alice)


@pytest.mark.parametrize(
    "version,url,code",
    [
        ("", SOURCE_URL, V2_CODE),
        ("2.0", "http://example.com/code.py", V2_CODE),
        (
            "2.0",
            "https://raw.githubusercontent.com/Habuskid/clauseroot/main/code.py",
            V2_CODE,
        ),
        ("2.0", SOURCE_URL, b""),
        ("2.0", SOURCE_URL, b"from genlayer import *"),
        (
            "2.0",
            SOURCE_URL,
            V2_CODE.split(b"\n", 1)[0] + b"\n\xff",
        ),
    ],
)
def test_deterministic_proposal_guards(
    direct_deploy, direct_alice, version, url, code
):
    governor = deploy_governor(direct_deploy, direct_alice)
    with pytest.raises(Exception):
        governor.propose_upgrade(version, url, code)
