import Link from "next/link";
import styles from "./docs.module.css";

const constitution = [
  {
    id: "C1",
    title: "Fee ceiling",
    rule: "Protocol fees must never exceed 2% (200 basis points).",
    code: "C1_FEE_CEILING",
  },
  {
    id: "C2",
    title: "User custody",
    rule: "No administrator may arbitrarily transfer user-owned balances.",
    code: "C2_ADMIN_ASSET_CONTROL",
  },
  {
    id: "C3",
    title: "Withdrawal right",
    rule: "Users must retain a direct withdrawal path for their own balance.",
    code: "C3_WITHDRAWAL_REMOVED",
  },
  {
    id: "C4",
    title: "Governed upgrades",
    rule: "The governed upgrade path must remain intact and cannot be replaced by an unrestricted bypass.",
    code: "C4_GOVERNOR_BYPASS",
  },
];

const lifecycle = [
  ["01", "Pin the evidence", "The proposer supplies a version, an immutable raw GitHub URL pinned to a full commit SHA, and the exact source bytes proposed for execution."],
  ["02", "Verify source identity", "The Governor fetches the public source itself and requires the fetched response body to exactly match the submitted upgrade bytes."],
  ["03", "Evaluate the constitution", "GenLayer validators independently evaluate the proposed code against the fixed constitutional clauses. The caller cannot replace or redefine the rubric."],
  ["04", "Normalize the verdict", "The Governor converts validator output into a stable APPROVE or REJECT decision plus known violation IDs, rejecting malformed or unknown outputs."],
  ["05", "Finalize on-chain", "The result is stored on-chain. Only an APPROVE result emits the target upgrade message, and that message is scheduled for finalization rather than early acceptance."],
  ["06", "Verify the target", "After finality, the target state and proposal history can be read directly from GenLayer. ClauseRoot does not need a private database to prove the result."],
];

const evidence = [
  ["V1 deployment", "0x2f0dd41848c31bd3bdf251cb70ea246a60f6251e3586ef3fbe6db4ebe86fc791", "Target deployed"],
  ["Governance handoff", "0xa3ecc64e816ff5bea956d3ee493a65d3d0c7acf2aea172edb340d520c6503446", "Governor became the governed root upgrader"],
  ["Proposal #1 · V2", "0xaa509b3203a26ff1d6e44323d233e583ace39ca36275ed96e677d2c7dc797211", "APPROVE · executed true · no violations"],
  ["Proposal #2 · V3", "0x0e412e3956a3a6f80b810d0c1e6f196f288dd51579aa84819f454c11e776ffaa", "REJECT · executed false · C1 + C4"],
];

export default function DocsPage() {
  return (
    <main className={styles.docs}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span className={styles.mark}>CR</span>
          <span>ClauseRoot</span>
        </Link>
        <span className={styles.headerLabel}>DOCUMENTATION</span>
        <Link className={styles.homeLink} href="/">Back to home ↗</Link>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <p>GUIDE</p>
          <a href="#overview">Overview</a>
          <a href="#model">Security model</a>
          <a href="#constitution">Constitution</a>
          <a href="#lifecycle">Proposal lifecycle</a>
          <a href="#deployment">Live deployment</a>
          <a href="#proof">Verified proof</a>
          <a href="#usage">Using ClauseRoot</a>
          <a href="#developer">Developer setup</a>
          <a href="#contracts">Contracts</a>
          <a href="#limits">Limitations</a>
        </aside>

        <article className={styles.content}>
          <section className={styles.hero} id="overview">
            <p className={styles.kicker}>GENLAYER · CONSTITUTIONAL UPGRADE CONTROL</p>
            <h1>Govern protocol upgrades by meaning, not just permissions.</h1>
            <p className={styles.lede}>
              ClauseRoot places a Governor Intelligent Contract between an upgrade proposer and an upgradeable protocol. GenLayer validators inspect the exact proposed source against a fixed constitution before the Governor can authorize a code replacement.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/dashboard">Open app ↗</Link>
              <a className={styles.secondary} href="https://github.com/Habuskid/clauseroot" target="_blank" rel="noreferrer">View source ↗</a>
            </div>
            <div className={styles.factGrid}>
              <Fact label="NETWORK" value="GenLayer Studio Dev" />
              <Fact label="CHAIN ID" value="61997" />
              <Fact label="CURRENT TARGET" value="v2.0" />
              <Fact label="LIVE PROPOSALS" value="2 verified" />
            </div>
          </section>

          <Section id="model" eyebrow="01 / MODEL" title="What ClauseRoot actually secures">
            <p>
              Traditional upgrade controls answer an identity question: <em>who is allowed to upgrade?</em> ClauseRoot adds a semantic question: <em>does the proposed code preserve the protocol&apos;s constitutional constraints?</em>
            </p>
            <p>
              The browser cannot approve an upgrade. The proposer cannot supply a friendlier rubric. The Governor stores the constitution, verifies the submitted source evidence, invokes GenLayer consensus, and only schedules an upgrade when the final decision is <code>APPROVE</code>.
            </p>
            <div className={styles.callout}>
              <strong>Authoritative state lives on-chain.</strong>
              <span>Proposal decisions, violation IDs, execution state, target version and governed protocol state are read from GenLayer rather than reconstructed from a private backend.</span>
            </div>
            <div className={styles.flow} aria-label="ClauseRoot architecture">
              <FlowNode title="Developer" copy="version + exact source" />
              <span>→</span>
              <FlowNode title="Governor" copy="fixed constitution" />
              <span>→</span>
              <FlowNode title="Validators" copy="semantic consensus" />
              <span>→</span>
              <FlowNode title="Target" copy="upgrade only if approved" />
            </div>
          </Section>

          <Section id="constitution" eyebrow="02 / CONSTITUTION" title="Four fixed clauses">
            <p>
              The current demonstration constitution is intentionally small and inspectable. Validator output is normalized into stable violation identifiers rather than storing arbitrary free-form explanations as protocol state.
            </p>
            <div className={styles.clauseGrid}>
              {constitution.map((clause) => (
                <div className={styles.clause} key={clause.id}>
                  <div><b>{clause.id}</b><span>{clause.title}</span></div>
                  <p>{clause.rule}</p>
                  <code>{clause.code}</code>
                </div>
              ))}
            </div>
          </Section>

          <Section id="lifecycle" eyebrow="03 / LIFECYCLE" title="From proposal to finality">
            <div className={styles.steps}>
              {lifecycle.map(([number, title, copy]) => (
                <div className={styles.step} key={number}>
                  <b>{number}</b>
                  <div><h3>{title}</h3><p>{copy}</p></div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="deployment" eyebrow="04 / DEPLOYMENT" title="Live GenLayer deployment">
            <p>
              The public app defaults to the verified deployment below. The dashboard independently checks that the Governor points to the expected target before displaying protocol state.
            </p>
            <div className={styles.definitionList}>
              <Definition label="Governor" value="0xBB7430D2AE62BDE464575d1c5b7015eA4C29dFA2" />
              <Definition label="Governed target" value="0x7f9287dFd869341E22Bb0270f06F43dacE1DcBB7" />
              <Definition label="RPC" value="https://studio-dev.genlayer.com/api" />
              <Definition label="Explorer" value="https://explorer-studio-dev.genlayer.com/" />
              <Definition label="Current state" value="version 2.0 · fee 50 bps · governance finalized" />
            </div>
          </Section>

          <Section id="proof" eyebrow="05 / PROOF" title="The golden path was executed for real">
            <p>
              ClauseRoot was exercised through both branches on the live network. V2 preserved the governed upgrade path and lowered the protocol fee, so validators approved it. V3 raised the fee to 1000 bps and introduced a Governor bypass, so validators rejected it.
            </p>
            <div className={styles.proofGrid}>
              <div className={styles.approveCard}>
                <span>PROPOSAL #1</span>
                <strong>APPROVE</strong>
                <p>v2.0 · executed true</p>
                <code>violations: NONE</code>
              </div>
              <div className={styles.rejectCard}>
                <span>PROPOSAL #2</span>
                <strong>REJECT</strong>
                <p>v3.0-rejected · executed false</p>
                <code>C1_FEE_CEILING | C4_GOVERNOR_BYPASS</code>
              </div>
            </div>
            <div className={styles.evidenceTable}>
              {evidence.map(([step, tx, result]) => (
                <div key={tx}>
                  <strong>{step}</strong>
                  <code>{tx}</code>
                  <span>{result}</span>
                </div>
              ))}
            </div>
            <div className={styles.callout}>
              <strong>Negative-path proof</strong>
              <span>After Proposal #2 finalized as REJECT, the live target still reported version 2.0, fee 50 bps, stored value “ClauseRoot genesis”, and finalized governance. The rejected code never replaced the target.</span>
            </div>
          </Section>

          <Section id="usage" eyebrow="06 / PRODUCT" title="Using ClauseRoot">
            <div className={styles.useGrid}>
              <UseCard number="1" title="Launch the app" copy="Connect an EIP-1193 wallet. ClauseRoot adds or switches to GenLayer Studio Dev, chain 61997, and verifies the active chain before enabling signing." />
              <UseCard number="2" title="Inspect the deployment" copy="Overview reads the Governor/target link, target version, fee, stored value and governance status directly from GenLayer." />
              <UseCard number="3" title="Prepare a proposal" copy="Provide a version, commit-pinned raw GitHub URL and the exact source bytes served by that immutable URL." />
              <UseCard number="4" title="Sign and wait" copy="Transaction Kit estimates live fees before signing. The UI tracks the proposal through GenLayer finality rather than treating early acceptance as execution." />
              <UseCard number="5" title="Verify the verdict" copy="Activity reads the stored proposal decision, violation IDs and execution flag from the Governor contract." />
              <UseCard number="6" title="Verify target state" copy="For an approval, confirm the target changed. For a rejection, confirm the target remained unchanged." />
            </div>
          </Section>

          <Section id="developer" eyebrow="07 / DEVELOPERS" title="Run the project locally">
            <p>Requirements: Node.js 20+, an EIP-1193 browser wallet, and network access to GenLayer Studio Dev.</p>
            <CodeBlock>{`git clone https://github.com/Habuskid/clauseroot.git
cd clauseroot
npm install
npm run dev`}</CodeBlock>
            <p>Production checks:</p>
            <CodeBlock>{`npm run lint
npm run build`}</CodeBlock>
            <div className={styles.stackGrid}>
              <Definition label="Next.js" value="15.5.7" />
              <Definition label="React" value="19.1.1" />
              <Definition label="genlayer-js" value="2.0.0-rc.1" />
              <Definition label="Transaction Kit" value="0.1.0-rc.2" />
            </div>
          </Section>

          <Section id="contracts" eyebrow="08 / CONTRACTS" title="Repository map">
            <div className={styles.contractList}>
              <Contract name="clause_root_governor.py" role="Production Governor" copy="Validates immutable source evidence, runs constitutional evaluation, normalizes validator output, stores proposal state and schedules approved target upgrades." />
              <Contract name="governed_protocol_v1.py" role="Initial target" copy="Bootstraps the governed protocol and supports the one-time authority handoff to the Governor." />
              <Contract name="governed_protocol_v2.py" role="Approved fixture" copy="Preserves storage and governed upgrade authority while lowering the protocol fee to 50 bps." />
              <Contract name="governed_protocol_v3_rejected.py" role="Rejected fixture" copy="Intentionally violates C1 and C4 by setting a 1000 bps fee and modifying the governed upgrade authority." />
            </div>
          </Section>

          <Section id="limits" eyebrow="09 / BOUNDARIES" title="Security boundaries and limitations">
            <div className={styles.boundaries}>
              <div>
                <h3>What the design enforces</h3>
                <ul>
                  <li>Private keys remain in the browser wallet.</li>
                  <li>The frontend cannot manufacture an approval.</li>
                  <li>The proposer cannot redefine the constitution.</li>
                  <li>Source evidence must be commit-pinned and byte-identical.</li>
                  <li>Unknown or malformed validator outputs are not converted into approval.</li>
                  <li>Approved upgrades execute on finalization, not merely early acceptance.</li>
                </ul>
              </div>
              <div>
                <h3>What ClauseRoot does not claim</h3>
                <ul>
                  <li>It is not a formal verification engine.</li>
                  <li>It is not a complete smart-contract security audit.</li>
                  <li>It does not prove every possible property of proposed code.</li>
                  <li>The current four-clause constitution is a focused demonstration, not a universal governance policy.</li>
                  <li>The project is experimental software built for the GenLayer Agent Tank hackathon.</li>
                </ul>
              </div>
            </div>
          </Section>

          <footer className={styles.footer}>
            <div><span className={styles.mark}>CR</span><strong>ClauseRoot</strong></div>
            <p>Constitutional upgrade control on GenLayer.</p>
            <div className={styles.footerLinks}>
              <a href="https://github.com/Habuskid/clauseroot" target="_blank" rel="noreferrer">GitHub ↗</a>
              <Link href="/dashboard">Open app ↗</Link>
              <Link href="/">Home ↗</Link>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className={styles.section} id={id}><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2>{children}</section>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className={styles.fact}><span>{label}</span><strong>{value}</strong></div>;
}

function FlowNode({ title, copy }: { title: string; copy: string }) {
  return <div><strong>{title}</strong><span>{copy}</span></div>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return <div className={styles.definition}><span>{label}</span><code>{value}</code></div>;
}

function UseCard({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className={styles.useCard}><b>{number}</b><h3>{title}</h3><p>{copy}</p></div>;
}

function Contract({ name, role, copy }: { name: string; role: string; copy: string }) {
  return <div className={styles.contract}><code>{name}</code><strong>{role}</strong><p>{copy}</p></div>;
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return <pre className={styles.code}><code>{children}</code></pre>;
}
