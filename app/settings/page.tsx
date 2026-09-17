import { Page, PanelTitle } from "../components/page-ui";
import {
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
      intro="Inspect the Studio Next network used by the console. Wallet signing remains in the browser; no private key is stored or proxied."
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
          title="Deployment addresses"
          note="PUBLIC VALUES ONLY"
        />
        <p className="muted">
          Use a real Studio Next Governor address on Proposal and Activity, and
          the matching Governor/target pair on Overview. Every value is read
          from chain; no deployment address or signing secret is embedded in
          the client bundle.
        </p>
      </section>
    </Page>
  );
}
