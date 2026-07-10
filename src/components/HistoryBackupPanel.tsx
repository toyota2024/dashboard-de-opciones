import { useRef, useState } from "react";
import {
  createBackupPayload,
  downloadCsv,
  downloadJson,
  importBackupFile,
  performanceSummaryToCsv,
  signalsToCsv,
} from "../lib/exportImport";
import { t, type Language } from "../lib/i18n";
import type {
  AutoEvaluationRule,
  ImportResult,
  PerformanceSummary,
  ScreenerSignalSnapshot,
} from "../types/options";

type HistoryBackupPanelProps = {
  signalHistory: ScreenerSignalSnapshot[];
  language: Language;
  performanceSummary: PerformanceSummary;
  autoEvaluationRule: Required<AutoEvaluationRule>;
  onImportSignals: (signals: ScreenerSignalSnapshot[]) => void;
};

export function HistoryBackupPanel({
  signalHistory,
  language,
  performanceSummary,
  autoEvaluationRule,
  onImportSignals,
}: HistoryBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (!window.confirm("Importing will merge signals into your current history. Continue?")) {
      resetInput();
      return;
    }

    const { result, mergedSignals } = await importBackupFile(file, signalHistory);

    setImportResult(result);
    if (result.importedSignals > 0) {
      onImportSignals(mergedSignals);
    }
    resetInput();
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="history-backup-panel" aria-label="History backup">
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{t("localDataProtection", language)}</p>
          <h2>{t("historyBackup", language)}</h2>
          <span>{t("backupDescription", language)}</span>
        </div>
        <span className="data-pill">{signalHistory.length} signals</span>
      </div>

      <p className="signal-history-disclaimer">
        {t("backupDisclaimer", language)}
      </p>

      <div className="history-backup-actions">
        <button
          className="secondary-action"
          onClick={() => downloadJson(`options-dashboard-signals-${today}.json`, signalHistory)}
          type="button"
        >
          {t("exportSignalsJson", language)}
        </button>
        <button
          className="secondary-action"
          onClick={() => downloadCsv(`options-dashboard-signals-${today}.csv`, signalsToCsv(signalHistory))}
          type="button"
        >
          {t("exportSignalsCsv", language)}
        </button>
        <button
          className="secondary-action"
          onClick={() => downloadCsv(`options-dashboard-performance-${today}.csv`, performanceSummaryToCsv(performanceSummary))}
          type="button"
        >
          {t("exportPerformanceCsv", language)}
        </button>
        <button
          className="primary-action"
          onClick={() =>
            downloadJson(
              `options-dashboard-backup-${today}.json`,
              createBackupPayload({ signalHistory, autoEvaluationRule, performanceSummary }),
            )
          }
          type="button"
        >
          {t("exportFullBackupJson", language)}
        </button>
        <button className="secondary-action" onClick={() => inputRef.current?.click()} type="button">
          {t("importBackupJson", language)}
        </button>
        <button
          className="secondary-action"
          onClick={() => downloadJson(`options-dashboard-auto-rule-${today}.json`, autoEvaluationRule)}
          type="button"
        >
          {t("exportAutoRuleJson", language)}
        </button>
        <input
          ref={inputRef}
          accept=".json,application/json"
          hidden
          type="file"
          onChange={(event) => {
            void importFile(event.target.files?.[0]);
          }}
        />
      </div>

      {importResult && (
        <div className={importResult.errors.length > 0 ? "status-panel status-panel--error" : "status-panel"}>
          <strong>
            Imported {importResult.importedSignals} signals. Skipped {importResult.skippedSignals} duplicates.
          </strong>
          {importResult.errors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
    </section>
  );
}
