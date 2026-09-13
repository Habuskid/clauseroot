# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ClauseRootGovernor(gl.Contract):
    """LLM-free governor used to prove finalized internal upgrade messages."""

    target: Address

    def __init__(self, target: bytes):
        self.target = Address(target)

    @gl.public.view
    def get_target(self) -> Address:
        return self.target

    @gl.public.write
    def upgrade_target(self, new_code: bytes) -> None:
        target = gl.get_contract_at(self.target)
        target.emit(on="finalized").upgrade(new_code)
