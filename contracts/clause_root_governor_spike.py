# { "Depends": "py-genlayer:9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0" }

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
            raise gl.vm.UserError("Only the spike controller can trigger the fixture")
        target = gl.get_contract_at(self.target)
        target.emit(on="finalized").upgrade(new_code)
