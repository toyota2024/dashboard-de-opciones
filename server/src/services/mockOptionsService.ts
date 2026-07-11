import type { OptionContract, OptionType } from "../types.js";

type MockExpiration = {
  expiration: string;
  dte: number;
};

type CreateMockOptionChainInput = {
  ticker: string;
  spot: number;
  expirations: MockExpiration[];
  strikeMin: number;
  strikeMax: number;
  strikeStep: number;
  callWallStrike: number;
  putWallStrike: number;
  maxPainBiasStrike: number;
  baseIv: number;
  callSkew?: number;
  putSkew?: number;
  volumeMultiplier?: number;
};

// Temporary mock until shared package or real API provider is added.
export function createMockOptionChain({
  ticker,
  spot,
  expirations,
  strikeMin,
  strikeMax,
  strikeStep,
  callWallStrike,
  putWallStrike,
  maxPainBiasStrike,
  baseIv,
  callSkew = 1,
  putSkew = 1,
  volumeMultiplier = 1,
}: CreateMockOptionChainInput): OptionContract[] {
  const strikes = buildStrikes(strikeMin, strikeMax, strikeStep);

  return expirations.flatMap(({ expiration, dte }) =>
    strikes.flatMap((strike) => [
      buildContract({
        ticker,
        spot,
        expiration,
        dte,
        strike,
        type: "call",
        baseIv,
        wallStrike: callWallStrike,
        oppositeWallStrike: putWallStrike,
        maxPainBiasStrike,
        skew: callSkew,
        volumeMultiplier,
      }),
      buildContract({
        ticker,
        spot,
        expiration,
        dte,
        strike,
        type: "put",
        baseIv,
        wallStrike: putWallStrike,
        oppositeWallStrike: callWallStrike,
        maxPainBiasStrike,
        skew: putSkew,
        volumeMultiplier,
      }),
    ]),
  );
}

// Temporary mock option chain until Alpaca options data is connected.
export function createTemporaryMockOptionChainForSpot(ticker: string, spot: number): OptionContract[] {
  const step = chooseStrikeStep(spot);
  const center = Math.round(spot / step) * step;
  const baseDate = new Date();

  return createMockOptionChain({
    ticker,
    spot,
    expirations: buildMockExpirations([16, 23, 30], baseDate),
    strikeMin: Math.max(step, center - step * 6),
    strikeMax: center + step * 6,
    strikeStep: step,
    callWallStrike: center + step * 2,
    putWallStrike: center - step * 2,
    maxPainBiasStrike: center,
    baseIv: chooseBaseIv(ticker),
    callSkew: 1.05,
    putSkew: 1,
    volumeMultiplier: 1,
  });
}

function buildContract({
  ticker,
  spot,
  expiration,
  dte,
  strike,
  type,
  baseIv,
  wallStrike,
  oppositeWallStrike,
  maxPainBiasStrike,
  skew,
  volumeMultiplier,
}: {
  ticker: string;
  spot: number;
  expiration: string;
  dte: number;
  strike: number;
  type: OptionType;
  baseIv: number;
  wallStrike: number;
  oppositeWallStrike: number;
  maxPainBiasStrike: number;
  skew: number;
  volumeMultiplier: number;
}): OptionContract {
  const distanceFromSpot = Math.abs(spot - strike);
  const moneynessPressure = Math.max(0, 1 - distanceFromSpot / Math.max(spot * 0.72, 1));
  const wallPressure = proximityBoost(strike, wallStrike, Math.max(spot * 0.035, 2)) * 7600 * skew;
  const secondaryPressure = proximityBoost(strike, oppositeWallStrike, Math.max(spot * 0.05, 2)) * 1500;
  const painPressure = proximityBoost(strike, maxPainBiasStrike, Math.max(spot * 0.04, 2)) * 4300;
  const dteWeight = dte <= 16 ? 0.82 : dte <= 23 ? 1.14 : 0.94;
  const openInterest = Math.round((420 + moneynessPressure * 1300 + wallPressure + secondaryPressure + painPressure) * dteWeight);
  const volume = Math.round((55 + openInterest * 0.12 + moneynessPressure * 90) * volumeMultiplier);
  const iv = round(baseIv + moneynessPressure * 0.07 + dte * 0.0011, 3);
  const premiumBase = Math.max(0.45, spot * 0.046 - distanceFromSpot * 0.045 + dte * spot * 0.00035);
  const mid = round(premiumBase + wallPressure * 0.00018 + painPressure * 0.00012, 2);
  const spread = round(Math.max(0.03, mid * (0.035 + distanceFromSpot / Math.max(spot * 40, 1))), 2);
  const bid = round(Math.max(0.01, mid - spread / 2), 2);
  const ask = round(mid + spread / 2, 2);
  const deltaSign = type === "call" ? 1 : -1;
  const deltaBase = type === "call" ? 1 - strike / (spot * 1.55) : strike / (spot * 1.55);

  return {
    symbol: `${ticker}-${expiration}-${strike}-${type.toUpperCase()}`,
    ticker,
    expiration,
    dte,
    strike,
    type,
    bid,
    ask,
    last: round((bid + ask) / 2, 2),
    volume,
    openInterest,
    impliedVolatility: iv,
    delta: round(deltaSign * Math.max(0.06, Math.min(0.94, deltaBase)), 3),
    gamma: round(0.004 + moneynessPressure * 0.017, 4),
    theta: round(-Math.max(0.02, mid * (0.014 + dte / 3200)), 3),
    vega: round(0.08 + moneynessPressure * 0.32, 3),
  };
}

function buildStrikes(min: number, max: number, step: number): number[] {
  const strikes = [];

  for (let strike = min; strike <= max; strike += step) {
    strikes.push(strike);
  }

  return strikes;
}

function proximityBoost(strike: number, target: number, width: number): number {
  return Math.max(0, 1 - Math.abs(strike - target) / width);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function chooseStrikeStep(spot: number): number {
  if (spot >= 500) return 50;
  if (spot >= 150) return 10;
  if (spot >= 50) return 5;
  return 1;
}

function chooseBaseIv(ticker: string): number {
  const ivByTicker: Record<string, number> = {
    AAPL: 0.22,
    AMD: 0.34,
    HOOD: 0.74,
    MU: 0.29,
    NVDA: 0.38,
    TSLA: 0.58,
  };

  return ivByTicker[ticker] ?? 0.35;
}

function buildMockExpirations(dteList: number[], baseDate: Date): MockExpiration[] {
  const chainBaseDate = new Date(baseDate);

  return dteList.map((dte) => {
    const expiration = new Date(chainBaseDate);
    expiration.setUTCDate(expiration.getUTCDate() + dte);

    return {
      expiration: expiration.toISOString().slice(0, 10),
      dte,
    };
  });
}
