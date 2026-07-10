import type { OptionContract, OptionType } from "../types/options";

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
