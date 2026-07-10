import type { ScreenerSignalSnapshot } from "../types/options";

const signalHistoryKey = "options-dashboard-signal-history";

export function getSignalHistory(): ScreenerSignalSnapshot[] {
  try {
    const rawValue = window.localStorage.getItem(signalHistoryKey);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsed) ? parsed.filter(isSignalSnapshot) : [];
  } catch {
    return [];
  }
}

export function saveSignalHistory(signals: ScreenerSignalSnapshot[]): void {
  window.localStorage.setItem(signalHistoryKey, JSON.stringify(signals));
}

export function addSignalSnapshot(signal: ScreenerSignalSnapshot): ScreenerSignalSnapshot[] {
  const nextSignals = [signal, ...getSignalHistory()];
  saveSignalHistory(nextSignals);

  return nextSignals;
}

export function deleteSignalSnapshot(id: string): ScreenerSignalSnapshot[] {
  const nextSignals = getSignalHistory().filter((signal) => signal.id !== id);
  saveSignalHistory(nextSignals);

  return nextSignals;
}

export function archiveSignalSnapshot(id: string): ScreenerSignalSnapshot[] {
  const nextSignals = getSignalHistory().map((signal) =>
    signal.id === id ? { ...signal, status: "archived" as const } : signal,
  );
  saveSignalHistory(nextSignals);

  return nextSignals;
}

export function updateSignalSnapshot(id: string, updates: Partial<ScreenerSignalSnapshot>): ScreenerSignalSnapshot[] {
  const nextSignals = getSignalHistory().map((signal) => (signal.id === id ? { ...signal, ...updates } : signal));
  saveSignalHistory(nextSignals);

  return nextSignals;
}

export function clearSignalHistory(): void {
  window.localStorage.removeItem(signalHistoryKey);
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
