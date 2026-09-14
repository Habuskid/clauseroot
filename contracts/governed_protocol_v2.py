# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class GovernedProtocol(gl.Contract):
    """V2 fixture: same storage layout, with one new read-only behavior."""

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
        return "2.0"

    @gl.public.view
    def get_fee_bps(self) -> u256:
        return u256(50)

    @gl.public.view
    def get_value_length(self) -> int:
        return len(self.value)

    @gl.public.view
    def is_governance_finalized(self) -> bool:
        return self.governance_finalized

    @gl.public.write
    def set_value(self, new_value: str) -> None:
        self.value = new_value

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        root = gl.storage.Root.get()
        if gl.message.sender_address not in root.upgraders.get():
            raise gl.vm.UserError("Only a governed root upgrader can replace code")
        code = root.code.get()
        code.truncate()
        code.extend(new_code)
