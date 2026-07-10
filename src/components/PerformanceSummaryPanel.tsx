import type { PerformanceSummary } from "../types/options";
import { t, type Language } from "../lib/i18n";

type PerformanceSummaryPanelProps = {
  summary: PerformanceSummary;
  language: Language;
};

export function PerformanceSummaryPanel({ summary, language }: PerformanceSummaryPanelProps) {
  const hasClosedSignals = summary.closedSignals > 0;

  return (
    <section className="performance-summary-panel" aria-label="Performance summary">
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{t("localPerformanceEngine", language)}</p>
          <h2>{t("performanceSummary", language)}</h2>
        </div>
      </div>

      {!hasClosedSignals && <p className="performance-empty">{t("performanceEmpty", language)}</p>}

      <div className="performance-grid">
        <Metric label={t("totalSignals", language)} value={summary.totalSignals} />
        <Metric label={t("open", language)} value={summary.openSignals} />
        <Metric label={t("closed", language)} value={summary.closedSignals} />
        <Metric label={t("archived", language)} value={summary.archivedSignals} />
        <Metric label={t("wins", language)} value={summary.wins} tone="positive" />
        <Metric label={t("losses", language)} value={summary.losses} tone="negative" />
        <Metric label={t("breakevens", language)} value={summary.breakevens} />
        <Metric label={t("winRate", language)} value={`${summary.winRate.toFixed(1)}%`} />
        <Metric label={`${t("avgReturn", language)} %`} value={`${summary.averageReturnPercent.toFixed(2)}%`} tone={tone(summary.averageReturnPercent)} />
        <Metric label={`${t("bestReturn", language)} %`} value={`${summary.bestReturnPercent.toFixed(2)}%`} tone={tone(summary.bestReturnPercent)} />
        <Metric label={`${t("worstReturn", language)} %`} value={`${summary.worstReturnPercent.toFixed(2)}%`} tone={tone(summary.worstReturnPercent)} />
        <Metric label={`${t("cumulativeReturn", language)} %`} value={`${summary.cumulativeReturnPercent.toFixed(2)}%`} tone={tone(summary.cumulativeReturnPercent)} />
        <Metric label={`${t("maxDrawdown", language)} %`} value={`${summary.maxDrawdownPercent.toFixed(2)}%`} tone="negative" />
      </div>

      <p className="performance-disclaimer">
        {t("performanceDisclaimer", language)}
      </p>
    </section>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "positive" | "negative" }) {
  return (
    <div className={`performance-card performance-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function tone(value: number): "neutral" | "positive" | "negative" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}
