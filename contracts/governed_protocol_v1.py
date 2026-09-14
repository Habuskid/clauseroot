# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class GovernedProtocol(gl.Contract):
    """Minimal upgrade target for the ClauseRoot authority spike.

    The storage layout is intentionally tiny and must remain unchanged in v2.
    """

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
        return u256(100)

    @gl.public.view
    def is_governance_finalized(self) -> bool:
        return self.governance_finalized

    @gl.public.write
    def set_value(self, new_value: str) -> None:
        self.value = new_value

    @gl.public.write
    def finalize_governance(self, governor: str) -> None:
        governor_address = Address(governor)
        if self.governance_finalized:
            raise gl.UserError("Governance is already finalized")
        if gl.message.sender_address != self.bootstrap_upgrader:
            raise gl.UserError("Only the bootstrap upgrader can finalize governance")

        root = gl.storage.Root.get()
        upgraders = root.upgraders.get()
        # Bootstrap is the only upgrader before this one-time handoff.
        if len(upgraders) != 1 or upgraders[0] != self.bootstrap_upgrader:
            raise gl.UserError("Unexpected bootstrap upgrader state")
        upgraders.truncate()
        upgraders.append(governor_address)
        self.governance_finalized = True

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(new_code)
