import { useMemo, useState } from "react";
import type { AutoEvaluationResult, ScreenerSignalSnapshot, SignalEvaluation, SignalOutcome } from "../types/options";
import { t, type Language } from "../lib/i18n";

type SignalHistoryPanelProps = {
  signals: ScreenerSignalSnapshot[];
  language: Language;
  evaluations: SignalEvaluation[];
  autoEvaluationResults: AutoEvaluationResult[];
  evaluationErrors: Array<{ ticker: string; error: string }>;
  isEvaluating: boolean;
  onEvaluateOpenSignals: () => void;
  onClose: (id: string, outcome: SignalOutcome) => void;
  onCloseAtCurrentPrice: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
};

type StatusFilter = "all" | ScreenerSignalSnapshot["status"];

export function SignalHistoryPanel({
  signals,
  language,
  evaluations,
  autoEvaluationResults,
  evaluationErrors,
  isEvaluating,
  onEvaluateOpenSignals,
  onClose,
  onCloseAtCurrentPrice,
  onArchive,
  onDelete,
  onClear,
}: SignalHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTicker, setSearchTicker] = useState("");
  const visibleSignals = useMemo(
    () =>
      signals.filter((signal) => {
        const matchesStatus = statusFilter === "all" || signal.status === statusFilter;
        const matchesTicker = signal.ticker.includes(searchTicker.trim().toUpperCase());

        return matchesStatus && matchesTicker;
      }),
    [searchTicker, signals, statusFilter],
  );

  function clearHistory() {
    if (window.confirm("Clear all tracked signal history?")) {
      onClear();
    }
  }

  return (
    <section className="signal-history-panel" aria-label="Signal history">
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{t("localSignalJournal", language)}</p>
          <h2>{t("signalHistory", language)}</h2>
          <span>{t("trackedSignalsDescription", language)}</span>
        </div>
        <span className="data-pill">{signals.length} tracked</span>
      </div>

      <p className="signal-history-disclaimer">
        {t("trackedSignalsDisclaimer", language)}
      </p>

      <div className="signal-history-controls">
        <label>
          <span>{t("status", language)}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">{t("all", language)}</option>
            <option value="open">{t("open", language)}</option>
            <option value="closed">{t("closed", language)}</option>
            <option value="archived">{t("archived", language)}</option>
          </select>
        </label>
        <label>
          <span>{t("searchTicker", language)}</span>
          <input value={searchTicker} onChange={(event) => setSearchTicker(event.target.value.toUpperCase())} placeholder="MSFT" />
        </label>
        <button className="secondary-action" disabled={signals.length === 0} onClick={clearHistory} type="button">
          {t("clearHistory", language)}
        </button>
        <button className="primary-action" disabled={signals.every((signal) => signal.status !== "open") || isEvaluating} onClick={onEvaluateOpenSignals} type="button">
          {isEvaluating ? "Evaluating..." : t("evaluateOpenSignals", language)}
        </button>
      </div>

      {evaluationErrors.length > 0 && (
        <div className="skipped-tickers">
          <strong>Evaluation errors</strong>
          {evaluationErrors.map((item) => (
            <span key={item.ticker}>
              {item.ticker}: {item.error}
            </span>
          ))}
        </div>
      )}

      {signals.length === 0 ? (
        <div className="status-panel">{t("noTrackedSignals", language)}</div>
      ) : (
        <div className="table-scroll">
          <table className="audit-table signal-history-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Ticker</th>
                <th>Entry Price</th>
                <th>Current</th>
                <th>Unrealized</th>
                <th>Exit Price</th>
                <th>Return %</th>
                <th>Outcome</th>
                <th>Closed At</th>
                <th>Timeframe</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Bias</th>
                <th>Bull %</th>
                <th>Neutral %</th>
                <th>Bear %</th>
                <th>Support</th>
                <th>Resistance</th>
                <th>Max Pain</th>
                <th>IV</th>
                <th>Data Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSignals.map((signal) => (
                <SignalHistoryRow
                  key={signal.id}
                  signal={signal}
                  evaluation={evaluations.find((item) => item.signalId === signal.id)}
                  autoEvaluation={autoEvaluationResults.find((item) => item.signalId === signal.id)}
                  onArchive={onArchive}
                  onClose={onClose}
                  onCloseAtCurrentPrice={onCloseAtCurrentPrice}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SignalHistoryRow({
  signal,
  evaluation,
  autoEvaluation,
  onArchive,
  onClose,
  onCloseAtCurrentPrice,
  onDelete,
}: {
  signal: ScreenerSignalSnapshot;
  evaluation?: SignalEvaluation;
  autoEvaluation?: AutoEvaluationResult;
  onArchive: (id: string) => void;
  onClose: (id: string, outcome: SignalOutcome) => void;
  onCloseAtCurrentPrice: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
                <tr>
                  <td>{formatDate(signal.createdAt)}</td>
                  <td>
                    <strong>{signal.ticker}</strong>
                    {signal.notes && <small>{signal.notes}</small>}
                    {autoEvaluation && signal.status === "open" && <small>Auto: {autoEvaluation.reason}</small>}
                  </td>
                  <td>{formatNumber(signal.price)}</td>
                  <td>{evaluation ? formatNumber(evaluation.currentPrice) : "-"}</td>
                  <td className={evaluation ? toneClass(evaluation.unrealizedReturnPercent) : ""}>
                    {evaluation ? `${evaluation.unrealizedReturnPercent.toFixed(2)}%` : "-"}
                  </td>
                  <td>{signal.exitPrice ? formatNumber(signal.exitPrice) : "-"}</td>
                  <td className={signal.returnPercent !== undefined ? toneClass(signal.returnPercent) : ""}>
                    {signal.returnPercent !== undefined ? `${signal.returnPercent.toFixed(2)}%` : "-"}
                  </td>
                  <td>{signal.outcome ? label(signal.outcome) : "-"}</td>
                  <td>{signal.closedAt ? formatDate(signal.closedAt) : "-"}</td>
                  <td>{signal.timeframe}</td>
                  <td>{signal.score}</td>
                  <td>
                    <span className={`grade-pill grade-pill--${signal.grade.toLowerCase()}`}>{signal.grade}</span>
                  </td>
                  <td>{signal.bias}</td>
                  <td>{signal.bullishProbability}%</td>
                  <td>{signal.neutralProbability}%</td>
                  <td>{signal.bearishProbability}%</td>
                  <td>{formatNumber(signal.support)}</td>
                  <td>{formatNumber(signal.resistance)}</td>
                  <td>{formatNumber(signal.maxPain)}</td>
                  <td>{(signal.iv * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`data-mode-badge data-mode-badge--${signal.dataMode}`}>{label(signal.dataMode)}</span>
                  </td>
                  <td>
                    <span className={`signal-status-badge signal-status-badge--${signal.status}`}>{label(signal.status)}</span>
                  </td>
                  <td>
                    <div className="screener-row-actions">
                      {signal.status === "open" && (
                        <>
                          <button className="open-row-button" onClick={() => onClose(signal.id, "win")} type="button">
                            Close as Win
                          </button>
                          <button className="open-row-button" onClick={() => onClose(signal.id, "loss")} type="button">
                            Close as Loss
                          </button>
                          <button className="open-row-button" onClick={() => onClose(signal.id, "breakeven")} type="button">
                            Close as Breakeven
                          </button>
                          <button className="open-row-button" onClick={() => onCloseAtCurrentPrice(signal.id)} type="button">
                            Close at Current Price
                          </button>
                        </>
                      )}
                      <button className="open-row-button" disabled={signal.status === "archived"} onClick={() => onArchive(signal.id)} type="button">
                        Archive
                      </button>
                      <button className="track-row-button" onClick={() => onDelete(signal.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
  );
}

function toneClass(value: number): string {
  if (value > 0) return "value-positive";
  if (value < 0) return "value-negative";
  return "";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
