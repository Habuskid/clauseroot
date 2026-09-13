"""Direct-mode checks for bootstrap authority and storage compatibility."""

import pytest


def test_bootstrap_authority_is_replaced(
    direct_vm, direct_deploy, direct_owner, direct_alice
):
    target = direct_deploy("contracts/governed_protocol_v1.py", "persisted")

    direct_vm.sender = direct_owner
    from genlayer.py.types import Address

    target.finalize_governance(Address(direct_alice).as_hex)

    assert target.is_governance_finalized() is True

    direct_vm.sender = direct_owner
    with pytest.raises(Exception):
        target.upgrade(args=[b"not-authorized"])
