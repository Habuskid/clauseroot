"""Real local GenLayer simulator test for the two-contract upgrade path."""

from pathlib import Path

import pytest
from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded
from genlayer_py.types import TransactionStatus


ROOT = Path(__file__).parents[2]
CONTRACTS = ROOT / "contracts"
DEFAULT_ACCOUNT = get_default_account()


@pytest.mark.integration
def test_governor_upgrades_target_after_finalized_message_and_preserves_state():
    target = get_contract_factory(
        contract_file_path=CONTRACTS / "governed_protocol_v1.py"
    ).deploy(args=["persisted"], wait_transaction_status=TransactionStatus.FINALIZED)
    governor = get_contract_factory(
        contract_file_path=CONTRACTS / "clause_root_governor_spike.py"
    ).deploy(
        args=[target.address],
        wait_transaction_status=TransactionStatus.FINALIZED,
    )

    handoff = target.finalize_governance(
        args=[governor.address]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED
    )
    assert tx_execution_succeeded(handoff)

    upgrade = governor.upgrade_target(
        args=[(CONTRACTS / "governed_protocol_v2.py").read_bytes()]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(upgrade)

    upgraded = get_contract_factory(
        contract_file_path=CONTRACTS / "governed_protocol_v2.py"
    ).build_contract(contract_address=target.address, account=DEFAULT_ACCOUNT)
    assert upgraded.get_value(args=[]).call() == "persisted"
    assert upgraded.get_value_length(args=[]).call() == len("persisted")
