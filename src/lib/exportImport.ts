import type {
  AutoEvaluationRule,
  BackupPayload,
  ImportResult,
  PerformanceSummary,
  ScreenerSignalSnapshot,
} from "../types/options";

type BackupPayloadParams = {
  signalHistory: ScreenerSignalSnapshot[];
  autoEvaluationRule: AutoEvaluationRule;
  performanceSummary?: PerformanceSummary;
};

const appName = "options-projection-dashboard";
const backupVersion = "1.0.0";
const maxImportSignals = 5000;

const signalCsvColumns: Array<keyof ScreenerSignalSnapshot> = [
  "id",
  "createdAt",
  "ticker",
  "price",
  "timeframe",
  "score",
  "grade",
  "bias",
  "bullishProbability",
  "neutralProbability",
  "bearishProbability",
  "support",
  "resistance",
  "maxPain",
  "projectionHead",
  "iv",
  "acceptedContracts",
  "rejectedContracts",
  "dataMode",
  "status",
  "exitPrice",
  "closedAt",
  "outcome",
  "returnPercent",
  "maxFavorableExcursion",
  "maxAdverseExcursion",
  "notes",
];

export function downloadJson(filename: string, data: unknown): void {
  downloadBlob(filename, JSON.stringify(data, null, 2), "application/json");
}

export function downloadCsv(filename: string, csv: string): void {
  downloadBlob(filename, csv, "text/csv;charset=utf-8");
}

export function signalsToCsv(signals: ScreenerSignalSnapshot[]): string {
  const rows = signals.map((signal) => signalCsvColumns.map((column) => csvCell(signal[column])).join(","));

  return [signalCsvColumns.join(","), ...rows].join("\n");
}

export function performanceSummaryToCsv(summary: PerformanceSummary): string {
  const rows: Array<[string, string | number]> = [
    ["totalSignals", summary.totalSignals],
    ["openSignals", summary.openSignals],
    ["closedSignals", summary.closedSignals],
    ["archivedSignals", summary.archivedSignals],
    ["wins", summary.wins],
    ["losses", summary.losses],
    ["breakevens", summary.breakevens],
    ["winRate", summary.winRate],
    ["averageReturnPercent", summary.averageReturnPercent],
    ["bestReturnPercent", summary.bestReturnPercent],
    ["worstReturnPercent", summary.worstReturnPercent],
    ["cumulativeReturnPercent", summary.cumulativeReturnPercent],
    ["maxDrawdownPercent", summary.maxDrawdownPercent],
  ];

  return ["metric,value", ...rows.map(([metric, value]) => `${csvCell(metric)},${csvCell(value)}`)].join("\n");
}

export function createBackupPayload(params: BackupPayloadParams): BackupPayload {
  return {
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    app: appName,
    signalHistory: params.signalHistory,
    autoEvaluationRule: params.autoEvaluationRule,
    performanceSummary: params.performanceSummary,
  };
}

export function validateBackupPayload(payload: unknown): payload is BackupPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as Partial<BackupPayload>;

  return candidate.app === appName && Array.isArray(candidate.signalHistory);
}

export function mergeSignalHistories(
  existing: ScreenerSignalSnapshot[],
  incoming: ScreenerSignalSnapshot[],
): ScreenerSignalSnapshot[] {
  const existingIds = new Set(existing.map((signal) => signal.id));
  const newSignals = incoming.filter((signal) => !existingIds.has(signal.id));

  return [...existing, ...newSignals].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function parseJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? "")));
      } catch {
        reject(new Error("Import file is not valid JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read import file."));
    reader.readAsText(file);
  });
}

export async function importBackupFile(
  file: File,
  existingSignals: ScreenerSignalSnapshot[],
): Promise<{ result: ImportResult; mergedSignals: ScreenerSignalSnapshot[] }> {
  try {
    const payload = await parseJsonFile(file);
    const incomingSignals = extractSignalsFromPayload(payload);

    if (incomingSignals.length > maxImportSignals) {
      return {
        result: {
          ok: false,
          importedSignals: 0,
          skippedSignals: 0,
          errors: ["Too many signals in import file."],
        },
        mergedSignals: existingSignals,
      };
    }

    const validSignals = incomingSignals.filter(isSignalSnapshot);
    const invalidSignals = incomingSignals.length - validSignals.length;
    const mergedSignals = mergeSignalHistories(existingSignals, validSignals);
    const importedSignals = mergedSignals.length - existingSignals.length;
    const skippedSignals = validSignals.length - importedSignals;
    const errors = invalidSignals > 0 ? [`Skipped ${invalidSignals} invalid signal records.`] : [];

    return {
      result: {
        ok: errors.length === 0,
        importedSignals,
        skippedSignals,
        errors,
      },
      mergedSignals,
    };
  } catch (caughtError) {
    return {
      result: {
        ok: false,
        importedSignals: 0,
        skippedSignals: 0,
        errors: [caughtError instanceof Error ? caughtError.message : "Import failed."],
      },
      mergedSignals: existingSignals,
    };
  }
}

function extractSignalsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (validateBackupPayload(payload)) {
    return payload.signalHistory;
  }

  throw new Error("Import file is not an options dashboard backup or signal array.");
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return "";

  const text = String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function isSignalSnapshot(value: unknown): value is ScreenerSignalSnapshot {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Record<keyof ScreenerSignalSnapshot, unknown>>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.ticker === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.timeframe === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.grade === "string" &&
    typeof candidate.bias === "string" &&
    typeof candidate.status === "string"
  );
}
