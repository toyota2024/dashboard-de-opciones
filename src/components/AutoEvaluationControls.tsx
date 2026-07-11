import type { AutoEvaluationResult, AutoEvaluationRule } from "../types/options";
import { t, type Language } from "../lib/i18n";

type AutoEvaluationControlsProps = {
  rule: Required<AutoEvaluationRule>;
  language: Language;
  results: AutoEvaluationResult[];
  errors: Array<{ ticker: string; error: string }>;
  isEvaluating: boolean;
  openSignalsCount: number;
  error: string;
  onRuleChange: (rule: Required<AutoEvaluationRule>) => void;
  onEvaluate: () => void;
};

export function AutoEvaluationControls({
  rule,
  language,
  results,
  errors,
  isEvaluating,
  openSignalsCount,
  error,
  onRuleChange,
  onEvaluate,
}: AutoEvaluationControlsProps) {
  const summary = {
    evaluated: results.length,
    closed: results.filter((result) => result.status === "closed").length,
    open: results.filter((result) => result.status === "open").length,
    errors: errors.length,
  };

  function updateRule<K extends keyof Required<AutoEvaluationRule>>(key: K, value: Required<AutoEvaluationRule>[K]) {
    onRuleChange({ ...rule, [key]: value });
  }

  return (
    <section className="auto-evaluation-panel" aria-label="Auto evaluation rules">
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{t("ruleBasedSignalTesting", language)}</p>
          <h2>{t("autoEvaluationRules", language)}</h2>
          <span>{t("autoEvaluationDescription", language)}</span>
        </div>
        <span className="data-pill">{openSignalsCount} {t("open", language)}</span>
      </div>

      <p className="signal-history-disclaimer">
        {t("autoEvaluationDisclaimer", language)}
      </p>

      <div className="auto-evaluation-grid">
        <label>
          <span>{t("targetMode", language)}</span>
          <select value={rule.targetMode} onChange={(event) => updateRule("targetMode", event.target.value as AutoEvaluationRule["targetMode"])}>
            <option value="projectionHead">{t("projectionHead", language)}</option>
            <option value="resistance">Resistance</option>
            <option value="fixedPercent">Fixed %</option>
          </select>
        </label>
        <label>
          <span>{t("stopMode", language)}</span>
          <select value={rule.stopMode} onChange={(event) => updateRule("stopMode", event.target.value as AutoEvaluationRule["stopMode"])}>
            <option value="support">{t("support", language)}</option>
            <option value="fixedPercent">Fixed %</option>
          </select>
        </label>
        <label>
          <span>{t("targetPercent", language)}</span>
          <input min="0.1" step="0.1" type="number" value={rule.targetPercent} onChange={(event) => updateRule("targetPercent", Number(event.target.value))} />
        </label>
        <label>
          <span>{t("stopPercent", language)}</span>
          <input min="0.1" step="0.1" type="number" value={rule.stopPercent} onChange={(event) => updateRule("stopPercent", Number(event.target.value))} />
        </label>
        <label>
          <span>{t("maxBarsForward", language)}</span>
          <input min="1" max="500" step="1" type="number" value={rule.maxBarsForward} onChange={(event) => updateRule("maxBarsForward", Number(event.target.value))} />
        </label>
        <label>
          <span>{t("neutralBreakPercent", language)}</span>
          <input min="0.1" step="0.1" type="number" value={rule.neutralMaxBreakPercent} onChange={(event) => updateRule("neutralMaxBreakPercent", Number(event.target.value))} />
        </label>
      </div>

      {error && <div className="status-panel status-panel--error">{error}</div>}

      <div className="auto-evaluation-actions">
        <button className="primary-action" disabled={isEvaluating || openSignalsCount === 0} onClick={onEvaluate} type="button">
          {isEvaluating ? "Auto Evaluating..." : t("autoEvaluateOpenSignals", language)}
        </button>
        <span>{t("autoEvaluationApproximation", language)}</span>
      </div>

      <section className="auto-evaluation-results" aria-label="Auto evaluation results">
        <div className="audit-title-row">
          <div>
            <p className="terminal-label">{language === "es" ? "Ultima ejecucion" : "Latest run"}</p>
          <h3>{t("autoEvaluationResults", language)}</h3>
          </div>
          <span className="data-pill">
            {language === "es"
              ? `${summary.evaluated} evaluadas / ${summary.closed} cerradas / ${summary.open} abiertas / ${summary.errors} errores`
              : `${summary.evaluated} evaluated / ${summary.closed} closed / ${summary.open} open / ${summary.errors} errors`}
          </span>
        </div>

        {openSignalsCount === 0 ? (
          <div className="status-panel">{t("noOpenSignalsToEvaluate", language)}</div>
        ) : results.length === 0 && errors.length === 0 ? (
          <div className="status-panel">Run auto evaluation to see target/stop results for open signals.</div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="skipped-tickers">
                <strong>Auto evaluation errors</strong>
                {errors.map((item) => (
                  <span key={item.ticker}>
                    {item.ticker}: {item.error}
                  </span>
                ))}
              </div>
            )}
            {results.length > 0 && (
              <div className="table-scroll">
                <table className="audit-table auto-evaluation-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Status</th>
                      <th>Outcome</th>
                      <th>Exit Price</th>
                      <th>Return %</th>
                      <th>Bars Checked</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.signalId}>
                        <td>{result.ticker}</td>
                        <td>{label(result.status)}</td>
                        <td>{result.outcome ? label(result.outcome) : "-"}</td>
                        <td>{result.exitPrice ? formatNumber(result.exitPrice) : "-"}</td>
                        <td className={result.returnPercent !== undefined ? toneClass(result.returnPercent) : ""}>
                          {result.returnPercent !== undefined ? `${result.returnPercent.toFixed(2)}%` : "-"}
                        </td>
                        <td>{result.barsChecked}</td>
                        <td>{result.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toneClass(value: number): string {
  if (value > 0) return "value-positive";
  if (value < 0) return "value-negative";
  return "";
}
