import { calculateReturnPercent } from "./performanceEngine";
import type { AutoEvaluationResult, AutoEvaluationRule, PricePoint, ScreenerSignalSnapshot } from "../types/options";

export const defaultAutoEvaluationRule: Required<AutoEvaluationRule> = {
  targetMode: "projectionHead",
  stopMode: "support",
  targetPercent: 3,
  stopPercent: 2,
  maxBarsForward: 30,
  neutralMaxBreakPercent: 1.5,
};

type SignalDirection = "bullish" | "bearish" | "neutral";

type VirtualTargetStop = {
  direction: SignalDirection;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  targetSource: string;
  stopSource: string;
};

type NormalizedCandle = {
  timestamp: string;
  high: number;
  low: number;
  close: number;
};

export function buildVirtualTargetStop(
  signal: ScreenerSignalSnapshot,
  rule: AutoEvaluationRule = defaultAutoEvaluationRule,
): VirtualTargetStop {
  const normalizedRule = normalizeAutoEvaluationRule(rule);
  const direction = getSignalDirection(signal);
  const entryPrice = signal.price;

  if (direction === "neutral") {
    return buildNeutralRange(signal, normalizedRule, entryPrice);
  }

  if (direction === "bearish") {
    return buildBearishTargetStop(signal, normalizedRule, entryPrice);
  }

  return buildBullishTargetStop(signal, normalizedRule, entryPrice);
}

export function evaluateSignalAgainstCandles(
  signal: ScreenerSignalSnapshot,
  candles: PricePoint[],
  rule: AutoEvaluationRule = defaultAutoEvaluationRule,
): AutoEvaluationResult {
  const targetStop = buildVirtualTargetStop(signal, rule);
  const normalizedRule = normalizeAutoEvaluationRule(rule);
  const candlesAfterSignal = candles
    .map(normalizeCandle)
    .filter((candle): candle is NormalizedCandle => Boolean(candle))
    .filter((candle) => new Date(candle.timestamp).getTime() > new Date(signal.createdAt).getTime())
    .slice(0, normalizedRule.maxBarsForward);

  if (candlesAfterSignal.length === 0) {
    return openResult(signal, 0, "No candles after signal creation.");
  }

  if (targetStop.direction === "neutral") {
    return evaluateNeutralSignal(signal, candlesAfterSignal, targetStop, normalizedRule.maxBarsForward);
  }

  return targetStop.direction === "bearish"
    ? evaluateBearishSignal(signal, candlesAfterSignal, targetStop)
    : evaluateBullishSignal(signal, candlesAfterSignal, targetStop);
}

function normalizeAutoEvaluationRule(rule: AutoEvaluationRule): Required<AutoEvaluationRule> {
  return {
    ...defaultAutoEvaluationRule,
    ...rule,
    targetPercent: rule.targetPercent && rule.targetPercent > 0 ? rule.targetPercent : defaultAutoEvaluationRule.targetPercent,
    stopPercent: rule.stopPercent && rule.stopPercent > 0 ? rule.stopPercent : defaultAutoEvaluationRule.stopPercent,
    maxBarsForward:
      rule.maxBarsForward && rule.maxBarsForward > 0 ? rule.maxBarsForward : defaultAutoEvaluationRule.maxBarsForward,
    neutralMaxBreakPercent:
      rule.neutralMaxBreakPercent && rule.neutralMaxBreakPercent > 0
        ? rule.neutralMaxBreakPercent
        : defaultAutoEvaluationRule.neutralMaxBreakPercent,
  };
}

function buildBullishTargetStop(
  signal: ScreenerSignalSnapshot,
  rule: Required<AutoEvaluationRule>,
  entryPrice: number,
): VirtualTargetStop {
  const targetByMode = rule.targetMode === "resistance" ? signal.resistance : signal.projectionHead;
  const targetPrice =
    rule.targetMode === "fixedPercent" || targetByMode <= entryPrice
      ? entryPrice * (1 + rule.targetPercent / 100)
      : targetByMode;
  const stopPrice =
    rule.stopMode === "support" && signal.support > 0 && signal.support < entryPrice
      ? signal.support
      : entryPrice * (1 - rule.stopPercent / 100);

  return {
    direction: "bullish",
    entryPrice,
    targetPrice,
    stopPrice,
    targetSource: rule.targetMode === "fixedPercent" || targetByMode <= entryPrice ? "Fixed target %" : rule.targetMode,
    stopSource: rule.stopMode === "support" && signal.support < entryPrice ? "Support" : "Fixed stop %",
  };
}

function buildBearishTargetStop(
  signal: ScreenerSignalSnapshot,
  rule: Required<AutoEvaluationRule>,
  entryPrice: number,
): VirtualTargetStop {
  const targetByMode = rule.targetMode === "resistance" ? signal.support : signal.projectionHead;
  const targetPrice =
    rule.targetMode === "fixedPercent" || targetByMode >= entryPrice
      ? entryPrice * (1 - rule.targetPercent / 100)
      : targetByMode;
  const stopPrice =
    rule.stopMode === "support" && signal.resistance > entryPrice
      ? signal.resistance
      : entryPrice * (1 + rule.stopPercent / 100);

  return {
    direction: "bearish",
    entryPrice,
    targetPrice,
    stopPrice,
    targetSource: rule.targetMode === "fixedPercent" || targetByMode >= entryPrice ? "Fixed target %" : rule.targetMode,
    stopSource: rule.stopMode === "support" && signal.resistance > entryPrice ? "Resistance" : "Fixed stop %",
  };
}

function buildNeutralRange(
  signal: ScreenerSignalSnapshot,
  rule: Required<AutoEvaluationRule>,
  entryPrice: number,
): VirtualTargetStop {
  const hasUsefulRange = signal.support > 0 && signal.resistance > signal.support;
  const lowerBound = hasUsefulRange ? signal.support : entryPrice * (1 - rule.neutralMaxBreakPercent / 100);
  const upperBound = hasUsefulRange ? signal.resistance : entryPrice * (1 + rule.neutralMaxBreakPercent / 100);

  return {
    direction: "neutral",
    entryPrice,
    targetPrice: upperBound,
    stopPrice: lowerBound,
    targetSource: hasUsefulRange ? "Resistance range" : "Neutral break %",
    stopSource: hasUsefulRange ? "Support range" : "Neutral break %",
  };
}

function evaluateBullishSignal(
  signal: ScreenerSignalSnapshot,
  candles: NormalizedCandle[],
  targetStop: VirtualTargetStop,
): AutoEvaluationResult {
  for (const [index, candle] of candles.entries()) {
    const targetTouched = candle.high >= targetStop.targetPrice;
    const stopTouched = candle.low <= targetStop.stopPrice;

    if (targetTouched && stopTouched) {
      return closedResult(signal, "loss", targetStop.stopPrice, candle.timestamp, index + 1, "Target and stop touched in same candle; conservative loss.");
    }
    if (targetTouched) {
      return closedResult(signal, "win", targetStop.targetPrice, candle.timestamp, index + 1, `Bullish target reached via ${targetStop.targetSource}.`);
    }
    if (stopTouched) {
      return closedResult(signal, "loss", targetStop.stopPrice, candle.timestamp, index + 1, `Bullish stop reached via ${targetStop.stopSource}.`);
    }
  }

  return openResult(signal, candles.length, "Target/stop not reached yet.");
}

function evaluateBearishSignal(
  signal: ScreenerSignalSnapshot,
  candles: NormalizedCandle[],
  targetStop: VirtualTargetStop,
): AutoEvaluationResult {
  for (const [index, candle] of candles.entries()) {
    const targetTouched = candle.low <= targetStop.targetPrice;
    const stopTouched = candle.high >= targetStop.stopPrice;

    if (targetTouched && stopTouched) {
      return closedResult(signal, "loss", targetStop.stopPrice, candle.timestamp, index + 1, "Target and stop touched in same candle; conservative loss.");
    }
    if (targetTouched) {
      return closedResult(signal, "win", targetStop.targetPrice, candle.timestamp, index + 1, `Bearish target reached via ${targetStop.targetSource}.`);
    }
    if (stopTouched) {
      return closedResult(signal, "loss", targetStop.stopPrice, candle.timestamp, index + 1, `Bearish stop reached via ${targetStop.stopSource}.`);
    }
  }

  return openResult(signal, candles.length, "Target/stop not reached yet.");
}

function evaluateNeutralSignal(
  signal: ScreenerSignalSnapshot,
  candles: NormalizedCandle[],
  targetStop: VirtualTargetStop,
  maxBarsForward: number,
): AutoEvaluationResult {
  for (const [index, candle] of candles.entries()) {
    if (candle.high > targetStop.targetPrice || candle.low < targetStop.stopPrice) {
      const exitPrice = candle.high > targetStop.targetPrice ? targetStop.targetPrice : targetStop.stopPrice;

      return closedResult(signal, "loss", exitPrice, candle.timestamp, index + 1, "Neutral range broke before max bars elapsed.");
    }
  }

  if (candles.length >= maxBarsForward) {
    const lastCandle = candles[candles.length - 1];

    return closedResult(signal, "win", lastCandle.close, lastCandle.timestamp, candles.length, "Neutral range held through max bars forward.");
  }

  return openResult(signal, candles.length, "Target/stop not reached yet.");
}

function closedResult(
  signal: ScreenerSignalSnapshot,
  outcome: "win" | "loss" | "breakeven",
  exitPrice: number,
  closedAt: string,
  barsChecked: number,
  reason: string,
): AutoEvaluationResult {
  const rawReturn = calculateReturnPercent(signal.price, exitPrice);
  const direction = getSignalDirection(signal);
  const returnPercent = direction === "bearish" ? -rawReturn : rawReturn;

  return {
    signalId: signal.id,
    ticker: signal.ticker,
    evaluated: true,
    status: "closed",
    outcome,
    exitPrice,
    returnPercent,
    closedAt,
    barsChecked,
    reason,
  };
}

function openResult(signal: ScreenerSignalSnapshot, barsChecked: number, reason: string): AutoEvaluationResult {
  return {
    signalId: signal.id,
    ticker: signal.ticker,
    evaluated: true,
    status: "open",
    barsChecked,
    reason,
  };
}

function getSignalDirection(signal: ScreenerSignalSnapshot): SignalDirection {
  const bias = signal.bias.toLowerCase();

  if (bias.includes("bear")) return "bearish";
  if (bias.includes("bull")) return "bullish";
  if (signal.bearishProbability > signal.bullishProbability && signal.bearishProbability > signal.neutralProbability) {
    return "bearish";
  }
  if (signal.bullishProbability > signal.bearishProbability && signal.bullishProbability > signal.neutralProbability) {
    return "bullish";
  }

  return "neutral";
}

function normalizeCandle(point: PricePoint): NormalizedCandle | null {
  const timestamp = point.timestamp ?? point.date;
  const close = point.close ?? point.price;

  if (!timestamp || close === undefined) return null;

  return {
    timestamp,
    high: point.high ?? close,
    low: point.low ?? close,
    close,
  };
}
