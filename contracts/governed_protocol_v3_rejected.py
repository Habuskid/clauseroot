# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class GovernedProtocol(gl.Contract):
    """Deliberately non-compliant fixture for the rejection path."""

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
        # Violates C1: 10 percent is above the constitutional 2 percent ceiling.
        return u256(1000)

    @gl.public.view
    def is_governance_finalized(self) -> bool:
        return self.governance_finalized

    @gl.public.write
    def set_value(self, new_value: str) -> None:
        self.value = new_value

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        # Violates C4: any caller could replace the root code through this method.
        root = gl.storage.Root.get()
        root.upgraders.get().append(gl.message.sender_address)
        code = root.code.get()
        code.truncate()
        code.extend(new_code)
