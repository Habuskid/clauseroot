# ClauseRoot

ClauseRoot is constitutional upgrade control for autonomous protocols built on GenLayer.

It puts a Governor Intelligent Contract between an upgrade proposer and the protocol being upgraded. A proposal is accepted only when GenLayer validators independently evaluate the exact proposed source against a fixed constitution and reach consensus that the code does not violate those rules.

> The browser never decides whether an upgrade is valid. The Governor and GenLayer consensus do.

ClauseRoot is an experimental hackathon project. It is not a security audit, formal verification system, or guarantee that contract code is safe.

## Agent Tank compliance

ClauseRoot is migrated to the Agent Tank Studio Next stack:

| Item | Value |
| --- | --- |
| Network | GenLayer Studio Next |
| RPC | `https://studio-next.genlayer.com/api` |
| Chain ID | `61997` |
| Explorer | `https://explorer-studio-dev.genlayer.com/` |
| GenLayerJS | `2.0.0-rc.1` |
| Transaction Kit | `0.1.0-rc.2` |
| React adapter | `0.1.0-rc.2` |
| Python client family | `genlayer-py v0.19-dev` |
| Test family | `genlayer-test v0.30-dev` |

The frontend uses Transaction Kit for a live Studio Next fee quote before wallet signing. It fails closed when the quoted fee policy is known to be stale.

## Why decentralized judgment matters

The upgrade decision is semantic rather than a simple numeric check.

A proposer submits exact contract source. Validators must determine whether that source violates any of four fixed constitutional rules. The Governor does not accept a caller-defined rubric and the frontend cannot override the result.

The production Governor:

1. validates version, source URL and source size;
2. requires a raw GitHub URL pinned to a full commit SHA;
3. fetches that source independently;
4. verifies the fetched bytes exactly match the submitted upgrade payload;
5. asks the leader to evaluate the fixed constitution;
6. asks validators to independently repeat the evaluation;
7. compares the meaningful `decision` and normalized `violations`;
8. stores the final proposal result on-chain; and
9. emits the target upgrade only for an approved result and only on finalization.

## Constitution

| ID | Rule |
| --- | --- |
| C1 | Protocol fees must never exceed 2% (200 basis points). |
| C2 | No administrator may arbitrarily transfer user-owned balances. |
| C3 | Users must retain a direct withdrawal path for their own balance. |
| C4 | The governed upgrade path must remain intact and cannot be replaced by an unrestricted bypass. |

Stable violation codes are stored instead of free-form AI explanations.

## Architecture

```text
Protocol developer
      |
      v
ClauseRoot web app
      |
      | wallet-signed Studio Next transaction
      v
ClauseRoot Governor
      |
      | exact source + fixed constitution
      v
GenLayer validators
      |
      +---- REJECT ----> store violations, target unchanged
      |
      +---- APPROVE ---> finalized internal upgrade message
                              |
                              v
                       Governed Protocol
```

The contract state is authoritative. ClauseRoot uses no backend database for proposals, decisions or execution records.

## Contracts

### `contracts/clause_root_governor.py`

Production Governor. It stores proposal state, performs immutable-source matching, runs independent semantic evaluation, normalizes violation codes and schedules approved upgrades.

### `contracts/governed_protocol_v1.py`

Initial upgradeable target. Bootstrap authority can be transferred exactly once to the Governor.

### `contracts/governed_protocol_v2.py`

Compliant upgrade fixture. It preserves the V1 storage layout, lowers the fee and keeps the governed upgrade path.

### `contracts/governed_protocol_v3_rejected.py`

Deliberately non-compliant fixture used to prove the rejection path. It exceeds the fee ceiling and introduces an unrestricted upgrade path.

### `contracts/clause_root_governor_spike.py`

Test-only authority fixture used by the local cross-contract upgrade integration test. Production deployment must use `clause_root_governor.py`.

All deployable contracts are pinned to the v0.6-compatible `py-genlayer` runner used by the current GenLayer `v2-dev` boilerplate.

## Frontend

The Next.js application provides:

- `/` product explanation;
- `/dashboard` live Governor/target verification and target-state reads;
- `/proposal` Studio Next fee estimation, wallet signing and proposal submission;
- `/activity` on-chain proposal history; and
- `/settings` the exact Studio Next network configuration.

No transaction, validator verdict, proposal or deployment is fabricated.

## Install

Requirements:

- Node.js 20+
- Python 3.12
- an EIP-1193 browser wallet
- access to GenLayer Studio Next

Install the frontend:

```bash
npm install
```

Copy the network template if local overrides are needed:

```bash
cp .env.example .env.local
```

Run:

```bash
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Python tests

Create a Python 3.12 environment and install the v0.6-compatible tooling:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
```

Direct deterministic tests:

```bash
.venv/Scripts/python -m pytest tests/direct -q
```

Local simulator integration test:

```bash
.venv/Scripts/python -m pytest tests/integration/test_upgrader_spike.py -q
```

The local integration test proves the lower-level finalized upgrade path and storage preservation. Consensus itself is intentionally not mocked in the direct tests.

## Studio Next deployment and demo proof

For the Agent Tank submission, deploy and record the real Studio Next evidence:

```text
Governed Protocol V1:
0x...

ClauseRoot Governor:
0x...

Governance finalization transaction:
...

Compliant V2 proposal transaction:
...

Compliant V2 result:
APPROVE

Approved child upgrade transaction:
...

Rejected V3 proposal transaction:
...

Rejected V3 result:
REJECT

Demo video:
...
```

These values must come from the actual Studio Next deployment and Portal submission. Do not replace them with placeholders in the final hackathon entry.

The expected golden path is:

```text
V1 target
-> deploy production Governor(target)
-> finalize target governance to Governor
-> propose commit-pinned V2
-> validators APPROVE
-> finalized child transaction replaces target code
-> target reports V2 and preserves state
-> propose commit-pinned V3
-> validators REJECT
-> violation codes are stored
-> no upgrade child transaction executes
-> target remains V2
```

## Security boundaries

- Private keys stay in the browser wallet.
- The app contains no server signing key.
- The frontend cannot approve a proposal.
- The proposer cannot redefine the constitution.
- Source URLs must use HTTPS raw GitHub content pinned to a full commit SHA.
- Source bytes fetched by validators must exactly match the submitted upgrade bytes.
- A failed or malformed consensus result is not converted into approval.
- Approved upgrades are emitted on finalization, not merely on early acceptance.
- The target removes bootstrap upgrade authority during the one-time governance handoff.

## Live application

`https://clauseroot.vercel.app`

After the Studio Next migration commit is deployed by Vercel, verify `/settings` shows chain `61997` and the Studio Next RPC before recording the demo.

## License

No license has been selected yet. All rights are reserved unless a license file is added.
