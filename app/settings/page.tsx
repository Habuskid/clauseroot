import { Page, PanelTitle } from "../components/page-ui";
import {
  CLAUSEROOT_GOVERNOR,
  CLAUSEROOT_TARGET,
  GENLAYER_CHAIN_ID_DECIMAL,
  GENLAYER_EXPLORER_URL,
  GENLAYER_NETWORK_LABEL,
  GENLAYER_RPC_URL,
} from "../../lib/genlayer";

export default function SettingsPage() {
  return (
    <Page
      title="Settings"
      kicker="DEPLOYMENT / NETWORK"
      intro="Inspect the Studio Next network and the verified ClauseRoot deployment used by this console. Wallet signing remains in the browser; no private key is stored or proxied."
    >
      <section className="panel">
        <PanelTitle
          label={GENLAYER_NETWORK_LABEL}
          title="Network details"
          note="CONSENSUS V0.6"
        />
        <div className="settings-list">
          <div>
            <span>RPC endpoint</span>
            <code>{GENLAYER_RPC_URL}</code>
          </div>
          <div>
            <span>Chain ID</span>
            <code>{GENLAYER_CHAIN_ID_DECIMAL}</code>
          </div>
          <div>
            <span>Block explorer</span>
            <a href={GENLAYER_EXPLORER_URL} target="_blank" rel="noreferrer">
              {GENLAYER_EXPLORER_URL}
            </a>
          </div>
          <div>
            <span>Transaction mode</span>
            <strong>Transaction Kit RC2 + EIP-1193 wallet</strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <PanelTitle
          label="CONTRACTS"
          title="Verified deployment"
          note="PUBLIC ON-CHAIN VALUES"
        />
        <div className="settings-list">
          <div>
            <span>ClauseRoot Governor</span>
            <code>{CLAUSEROOT_GOVERNOR}</code>
          </div>
          <div>
            <span>Governed target</span>
            <code>{CLAUSEROOT_TARGET}</code>
          </div>
        </div>
        <p className="muted">
          These public addresses are the canonical Agent Tank demo deployment.
          The dashboard and activity views still read authoritative state from
          Studio Next; the client does not store validator verdicts locally.
        </p>
      </section>
    </Page>
  );
}
