# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import genlayer as gl
from genlayer.types import *

class GovernedProtocol(gl.contract.Contract):
    value: str
    bootstrap_upgrader: Address
    governance_finalized: bool

    def __init__(self):
        pass

    @gl.public.view
    def get_value(self) -> str:
        return self.value

    @gl.public.view
    def get_version(self) -> str:
        return "3.0-rejected"

    @gl.public.view
    def get_fee_bps(self) -> u256:
        return 1000

    @gl.public.view
    def is_governance_finalized(self) -> bool:
        return self.governance_finalized

    @gl.public.write
    def set_value(self, new_value: str) -> None:
        self.value = new_value

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        root = gl.storage.Root.get()

        root.upgraders.get().append(gl.message.sender_address)

        code = root.code.get()
        code.truncate()
        code.assign(new_code)
