import { createMockOptionChain } from "./mockOptionsService.js";
import type { OptionContract } from "../types.js";

type ServerMockOptionChainInput = {
  ticker: string;
  spot: number;
  dteList: number[];
  strikeStep: number;
  baseIv: number;
};

// Temporary mock option chain until real options data provider is connected.
export function createServerMockOptionChain({
  ticker,
  spot,
  dteList,
  strikeStep,
  baseIv,
}: ServerMockOptionChainInput): OptionContract[] {
  const center = Math.round(spot / strikeStep) * strikeStep;
  const baseDate = new Date();
  const expirations = dteList.map((dte) => ({
    expiration: buildExpirationDate(baseDate, dte),
    dte,
  }));

  return createMockOptionChain({
    ticker,
    spot,
    expirations,
    strikeMin: Math.max(strikeStep, center - strikeStep * 8),
    strikeMax: center + strikeStep * 8,
    strikeStep,
    callWallStrike: center + strikeStep * 2,
    putWallStrike: center - strikeStep * 2,
    maxPainBiasStrike: center - strikeStep,
    baseIv,
    callSkew: 1.08,
    putSkew: 1.04,
    volumeMultiplier: 1,
  });
}

export function chooseServerMockStrikeStep(spot: number): number {
  if (spot >= 500) return 50;
  if (spot >= 150) return 10;
  if (spot >= 50) return 5;
  return 1;
}

export function chooseServerMockBaseIv(ticker: string): number {
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

function buildExpirationDate(baseDate: Date, dte: number): string {
  const expiration = new Date(baseDate);
  expiration.setUTCDate(expiration.getUTCDate() + dte);

  return expiration.toISOString().slice(0, 10);
}
