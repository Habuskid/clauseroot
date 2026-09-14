# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ClauseRootGovernor(gl.Contract):
    """Test-only authority spike used to prove finalized internal messages.

    Production deployments must use clause_root_governor.py. The controller
    guard prevents arbitrary callers from turning this isolated fixture into
    a public upgrade relay.
    """

    target: Address
    controller: Address

    def __init__(self, target: Address):
        self.target = target if isinstance(target, Address) else Address(target)
        self.controller = gl.message.sender_address

    @gl.public.view
    def get_target(self) -> Address:
        return self.target

    @gl.public.write
    def upgrade_target(self, new_code: bytes) -> None:
        if gl.message.sender_address != self.controller:
            raise gl.UserError("Only the spike controller can trigger the fixture")
        target = gl.get_contract_at(self.target)
        target.emit(on="finalized").upgrade(new_code)
