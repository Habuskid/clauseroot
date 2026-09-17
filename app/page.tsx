import Link from "next/link";
import { LandingAction } from "./components/landing-action";

export default function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">
          <span className="mark">CR</span>
          <span>ClauseRoot</span>
        </Link>
        <span>CONSTITUTIONAL UPGRADE CONTROL</span>
        <Link href="/dashboard">Launch app ↗</Link>
      </nav>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">GOVERNANCE THAT EXECUTES ITS VERDICT</p>
          <h1>
            Protocol upgrades,
            <br />
            bounded by code.
          </h1>
          <p className="landing-lede">
            ClauseRoot lets GenLayer validators evaluate proposed contract code
            against a fixed constitution before an approved upgrade can
            execute.
          </p>
          <LandingAction />
        </div>
        <div className="landing-proof">
          <p>THE BOUNDED QUESTION</p>
          <strong>
            Does this proposed target code violate any fixed constitutional
            clause?
          </strong>
          <div><span>01</span><p>Exact source evidence</p></div>
          <div><span>02</span><p>Independent validator review</p></div>
          <div><span>03</span><p>On-chain execution</p></div>
        </div>
      </section>

      <section className="landing-strip">
        <span>NO CUSTODIAL KEYS</span>
        <span>NO OFF-CHAIN DATABASE</span>
        <span>NO FABRICATED VERDICTS</span>
        <span>STUDIO NEXT · CHAIN 61997</span>
      </section>

      <section className="landing-section" id="how-it-works">
        <div><p className="eyebrow">THE CONTROL PATH</p><h2>Evidence in. Consensus. Upgrade out.</h2></div>
        <div className="landing-steps">
          <article><b>01</b><h3>Propose exact code</h3><p>A wallet submits contract bytes and a commit-pinned public source URL.</p></article>
          <article><b>02</b><h3>Evaluate clauses</h3><p>Validators independently check the proposal against the fixed constitution.</p></article>
          <article><b>03</b><h3>Execute the verdict</h3><p>Only an approved proposal can instruct the governed target to upgrade.</p></article>
        </div>
      </section>

      <footer className="landing-footer">
        <span>ClauseRoot</span>
        <span>Built on GenLayer Studio Next</span>
        <Link href="/dashboard">Launch app ↗</Link>
      </footer>
    </main>
  );
}
