# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import genlayer as gl
from genlayer.types import *

class GovernedProtocol(gl.contract.Contract):
    value: str
    bootstrap_upgrader: Address
    governance_finalized: bool

    def __init__(self, initial_value: str):
        self.value = initial_value
        self.bootstrap_upgrader = gl.message.sender_address
        self.governance_finalized = False

        root = gl.storage.Root.get()
        root.upgraders.get().append(self.bootstrap_upgrader)

    @gl.public.view
    def get_value(self) -> str:
        return self.value

    @gl.public.view
    def get_version(self) -> str:
        return "1.0"

    @gl.public.view
    def get_fee_bps(self) -> u256:
        return 100

    @gl.public.view
    def is_governance_finalized(self) -> bool:
        return self.governance_finalized

    @gl.public.write
    def set_value(self, new_value: str) -> None:
        self.value = new_value

    @gl.public.write
    def finalize_governance(self, governor: Address) -> None:
        if self.governance_finalized:
            raise gl.vm.UserError("Governance is already finalized")

        if gl.message.sender_address != self.bootstrap_upgrader:
            raise gl.vm.UserError("Only the bootstrap upgrader can finalize governance")

        root = gl.storage.Root.get()
        upgraders = root.upgraders.get()

        if len(upgraders) != 1 or upgraders[0] != self.bootstrap_upgrader:
            raise gl.vm.UserError("Unexpected bootstrap upgrader state")

        upgraders.truncate()
        upgraders.append(governor)

        self.governance_finalized = True

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        root = gl.storage.Root.get()

        if gl.message.sender_address not in root.upgraders.get():
            raise gl.vm.UserError("Only an authorized root upgrader can replace code")

        code = root.code.get()
        code.truncate()
        code.assign(new_code)
