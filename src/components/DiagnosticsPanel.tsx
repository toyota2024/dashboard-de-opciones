import { InfoTooltip } from "./InfoTooltip";
import type { FilterRejectReason, OptionsDiagnostics } from "../types/options";

const reasonLabels: Record<FilterRejectReason, string> = {
  LOW_OPEN_INTEREST: "Low OI",
  LOW_VOLUME: "Low Volume",
  WIDE_SPREAD: "Wide Spread",
  HIGH_THETA: "High Theta",
  DTE_OUT_OF_RANGE: "DTE Out of Range",
};

const reasonTerms: Record<FilterRejectReason, string> = {
  LOW_OPEN_INTEREST: "openInterest",
  LOW_VOLUME: "volume",
  WIDE_SPREAD: "bidAskSpread",
  HIGH_THETA: "theta",
  DTE_OUT_OF_RANGE: "dte",
};

const reasons = Object.keys(reasonLabels) as FilterRejectReason[];

type DiagnosticsPanelProps = {
  diagnostics: OptionsDiagnostics;
};

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  const rejectionRate =
    diagnostics.totalContracts === 0 ? 0 : (diagnostics.rejectedContracts / diagnostics.totalContracts) * 100;

  return (
    <section className="audit-panel">
      <p className="terminal-label">Filter diagnostics</p>
      <h3>Contract Quality Gate</h3>

      <div className="audit-stat-grid">
        <Stat termKey="filteredContracts" label="Total contracts" value={diagnostics.totalContracts.toString()} />
        <Stat termKey="filteredContracts" label="Accepted" value={diagnostics.acceptedContracts.toString()} tone="green" />
        <Stat termKey="rejectionRate" label="Rejected" value={diagnostics.rejectedContracts.toString()} tone="red" />
        <Stat termKey="rejectionRate" label="Rejection rate" value={`${rejectionRate.toFixed(1)}%`} />
      </div>

      <div className="rejection-list">
        {reasons.map((reason) => (
          <div key={reason}>
            <span>
              <InfoTooltip termKey={reasonTerms[reason]} label={reasonLabels[reason]} compact />
            </span>
            <strong>{diagnostics.rejectionSummary[reason]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({
  termKey,
  label,
  value,
  tone = "neutral",
}: {
  termKey: string;
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red";
}) {
  return (
    <div className={`audit-stat audit-stat--${tone}`}>
      <span>
        <InfoTooltip termKey={termKey} label={label} compact />
      </span>
      <strong>{value}</strong>
    </div>
  );
}
