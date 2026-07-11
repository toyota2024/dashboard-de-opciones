import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { FilterRejectReason, OptionsDiagnostics } from "../types/options";

const reasonLabels: Record<Language, Record<FilterRejectReason, string>> = {
  en: {
    LOW_OPEN_INTEREST: "Low OI",
    LOW_VOLUME: "Low Volume",
    WIDE_SPREAD: "Wide Spread",
    HIGH_THETA: "High Theta",
    DTE_OUT_OF_RANGE: "DTE Out of Range",
  },
  es: {
    LOW_OPEN_INTEREST: "Bajo OI",
    LOW_VOLUME: "Bajo volumen",
    WIDE_SPREAD: "Spread amplio",
    HIGH_THETA: "Theta alto",
    DTE_OUT_OF_RANGE: "DTE fuera de rango",
  },
};

const reasonTerms: Record<FilterRejectReason, string> = {
  LOW_OPEN_INTEREST: "openInterest",
  LOW_VOLUME: "volume",
  WIDE_SPREAD: "bidAskSpread",
  HIGH_THETA: "theta",
  DTE_OUT_OF_RANGE: "dte",
};

const reasons = Object.keys(reasonLabels.en) as FilterRejectReason[];

type DiagnosticsPanelProps = {
  diagnostics: OptionsDiagnostics;
  language?: Language;
};

export function DiagnosticsPanel({ diagnostics, language = "en" }: DiagnosticsPanelProps) {
  const rejectionRate =
    diagnostics.totalContracts === 0 ? 0 : (diagnostics.rejectedContracts / diagnostics.totalContracts) * 100;

  return (
    <section className="audit-panel">
      <p className="terminal-label">{language === "es" ? "Diagnostico de filtros" : "Filter diagnostics"}</p>
      <h3>{language === "es" ? "Filtro de calidad de contratos" : "Contract Quality Gate"}</h3>

      <div className="audit-stat-grid">
        <Stat termKey="filteredContracts" label={language === "es" ? "Contratos totales" : "Total contracts"} value={diagnostics.totalContracts.toString()} />
        <Stat termKey="filteredContracts" label={language === "es" ? "Aceptados" : "Accepted"} value={diagnostics.acceptedContracts.toString()} tone="green" />
        <Stat termKey="rejectionRate" label={language === "es" ? "Rechazados" : "Rejected"} value={diagnostics.rejectedContracts.toString()} tone="red" />
        <Stat termKey="rejectionRate" label={language === "es" ? "Tasa de rechazo" : "Rejection rate"} value={`${rejectionRate.toFixed(1)}%`} />
      </div>

      <div className="rejection-list">
        {reasons.map((reason) => (
          <div key={reason}>
            <span>
              <InfoTooltip termKey={reasonTerms[reason]} label={reasonLabels[language][reason]} compact />
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
