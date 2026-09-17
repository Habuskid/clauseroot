# ClauseRoot

ClauseRoot is constitutional upgrade control for autonomous protocols built on GenLayer.

It puts a Governor Intelligent Contract between an upgrade proposer and the protocol being upgraded. A proposal is accepted only when GenLayer validators independently evaluate the exact proposed source against a fixed constitution and reach consensus that the code does not violate those rules.

> The browser never decides whether an upgrade is valid. The Governor and GenLayer consensus do.

ClauseRoot is an experimental hackathon project. It is not a security audit, formal verification system, or guarantee that contract code is safe.

## Agent Tank stack

| Item | Value |
| --- | --- |
| Network | GenLayer Studio Dev / Studio Next preview |
| RPC | `https://studio-dev.genlayer.com/api` |
| Chain ID | `61997` |
| Explorer | `https://explorer-studio-dev.genlayer.com/` |
| GenLayerJS | `2.0.0-rc.1` |
| Transaction Kit | `0.1.0-rc.2` |
| React adapter | `0.1.0-rc.2` |

The frontend uses Transaction Kit for live GenLayer fee estimation before wallet signing. The Governor, target state and proposal history are read directly from the live network.

## Why decentralized judgment matters

The upgrade decision is semantic rather than a simple numeric check.

A proposer submits exact contract source. Validators determine whether that source violates any of four fixed constitutional rules. The Governor does not accept a caller-defined rubric and the frontend cannot override the result.

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
      | wallet-signed GenLayer transaction
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

## Live GenLayer deployment

| Item | Value |
| --- | --- |
| Governor | `0xBB7430D2AE62BDE464575d1c5b7015eA4C29dFA2` |
| Governed target | `0x7f9287dFd869341E22Bb0270f06F43dacE1DcBB7` |
| Current target version | `2.0` |
| Current fee | `50 bps` |
| Stored value | `ClauseRoot genesis` |
| Governance finalized | `true` |

### Verified transaction evidence

| Step | Transaction | Result |
| --- | --- | --- |
| V1 deployment | `0x2f0dd41848c31bd3bdf251cb70ea246a60f6251e3586ef3fbe6db4ebe86fc791` | Target deployed |
| Governance handoff | `0xa3ecc64e816ff5bea956d3ee493a65d3d0c7acf2aea172edb340d520c6503446` | Bootstrap authority transferred to Governor |
| Proposal #1: V2 | `0xaa509b3203a26ff1d6e44323d233e583ace39ca36275ed96e677d2c7dc797211` | `APPROVE`, executed `true`, no violations |
| Proposal #2: V3 | `0x0e412e3956a3a6f80b810d0c1e6f196f288dd51579aa84819f454c11e776ffaa` | `REJECT`, executed `false` |

Proposal #2 stored the exact violation set:

```text
C1_FEE_CEILING|C4_GOVERNOR_BYPASS
```

After Proposal #2 finalized, the target still reported version `2.0`, fee `50`, stored value `ClauseRoot genesis`, and `governance_finalized = true`. This is the negative-path proof: the rejected code was recorded by the Governor but did not replace the live target.

## Contracts

### `contracts/clause_root_governor.py`

Production Governor. It stores proposal state, performs immutable-source matching, runs independent semantic evaluation, normalizes violation codes and schedules approved upgrades.

### `contracts/governed_protocol_v1.py`

Initial upgradeable target. Bootstrap authority can be transferred exactly once to the Governor.

### `contracts/governed_protocol_v2.py`

Compliant upgrade fixture. It preserves the V1 storage layout, lowers the fee and keeps the governed upgrade path.

### `contracts/governed_protocol_v3_rejected.py`

Deliberately non-compliant fixture used to prove the rejection path. It raises the fee to 1000 bps and modifies the governed upgrade authority, triggering `C1_FEE_CEILING` and `C4_GOVERNOR_BYPASS`.

### `contracts/clause_root_governor_spike.py`

Test-only authority fixture used by the local cross-contract upgrade integration test. Production deployment uses `clause_root_governor.py`.

## Frontend

The Next.js application provides:

- `/` product explanation;
- `/docs` public project documentation;
- `/dashboard` the live Governor/target pair and authoritative target-state reads;
- `/proposal` live fee estimation, wallet signing and proposal submission;
- `/activity` live on-chain proposal history; and
- `/settings` the exact GenLayer network configuration.

The dashboard and activity pages default to the verified hackathon deployment above. No transaction, validator verdict, proposal or deployment is fabricated.

## Install

Requirements:

- Node.js 20+
- an EIP-1193 browser wallet
- access to GenLayer Studio Dev

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

The repository also includes direct and integration tests for contract behavior. The local integration test proves the lower-level finalized upgrade path and storage preservation. Consensus itself is not mocked as evidence for the hackathon submission; the proof above comes from the real GenLayer deployment.

## Demonstrated golden path

```text
V1 target
-> deploy production Governor(target)
-> finalize target governance to Governor
-> propose commit-pinned V2
-> validators APPROVE
-> finalized internal message replaces target code
-> target reports V2 and preserves state
-> propose commit-pinned V3
-> validators REJECT
-> C1_FEE_CEILING and C4_GOVERNOR_BYPASS are stored
-> no upgrade child executes
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

Public documentation is available at `/docs`. Before recording a demo, verify `/settings` reports chain `61997`, `/dashboard` resolves the live target as `2.0`, and `/activity` shows Proposal #1 as `APPROVE` and Proposal #2 as `REJECT`.

## License

No license has been selected yet. All rights are reserved unless a license file is added.
