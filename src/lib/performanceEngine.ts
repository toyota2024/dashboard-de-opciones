import type { PerformanceSummary, ScreenerSignalSnapshot, SignalEvaluation, SignalOutcome } from "../types/options";

export function calculateReturnPercent(entryPrice: number, exitPrice: number): number {
  if (entryPrice <= 0) return 0;

  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

export function suggestOutcomeFromReturn(returnPercent: number): SignalOutcome {
  if (returnPercent >= 2) return "win";
  if (returnPercent <= -2) return "loss";
  return "breakeven";
}

export function calculatePerformanceSummary(signals: ScreenerSignalSnapshot[]): PerformanceSummary {
  const allClosedSignals = signals.filter((signal) => signal.status === "closed");
  const returnableClosedSignals = allClosedSignals.filter((signal) => signal.returnPercent !== undefined);
  const returns = returnableClosedSignals.map((signal) => signal.returnPercent ?? 0);
  const wins = returnableClosedSignals.filter((signal) => signal.outcome === "win").length;
  const losses = returnableClosedSignals.filter((signal) => signal.outcome === "loss").length;
  const breakevens = returnableClosedSignals.filter((signal) => signal.outcome === "breakeven").length;

  return {
    totalSignals: signals.length,
    openSignals: signals.filter((signal) => signal.status === "open").length,
    closedSignals: allClosedSignals.length,
    archivedSignals: signals.filter((signal) => signal.status === "archived").length,
    wins,
    losses,
    breakevens,
    winRate: returnableClosedSignals.length === 0 ? 0 : (wins / returnableClosedSignals.length) * 100,
    averageReturnPercent: average(returns),
    bestReturnPercent: returns.length === 0 ? 0 : Math.max(...returns),
    worstReturnPercent: returns.length === 0 ? 0 : Math.min(...returns),
    cumulativeReturnPercent: calculateCumulativeReturn(returns),
    maxDrawdownPercent: calculateMaxDrawdown(returnableClosedSignals),
  };
}

export function evaluateOpenSignals(
  signals: ScreenerSignalSnapshot[],
  latestPricesByTicker: Record<string, number>,
): SignalEvaluation[] {
  return signals
    .filter((signal) => signal.status === "open")
    .flatMap((signal) => {
      const currentPrice = latestPricesByTicker[signal.ticker];

      if (!currentPrice) return [];

      const unrealizedReturnPercent = calculateReturnPercent(signal.price, currentPrice);

      return [
        {
          signalId: signal.id,
          ticker: signal.ticker,
          entryPrice: signal.price,
          currentPrice,
          unrealizedReturnPercent,
          suggestedOutcome: suggestOutcomeFromReturn(unrealizedReturnPercent),
        },
      ];
    });
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateCumulativeReturn(returns: number[]): number {
  const endingEquity = returns.reduce((equity, returnPercent) => equity * (1 + returnPercent / 100), 100);

  return endingEquity - 100;
}

function calculateMaxDrawdown(closedSignals: ScreenerSignalSnapshot[]): number {
  const sortedSignals = [...closedSignals].sort((left, right) =>
    (left.closedAt ?? left.createdAt).localeCompare(right.closedAt ?? right.createdAt),
  );
  let equity = 100;
  let peak = 100;
  let maxDrawdown = 0;

  for (const signal of sortedSignals) {
    equity *= 1 + (signal.returnPercent ?? 0) / 100;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, ((equity - peak) / peak) * 100);
  }

  return maxDrawdown;
}
