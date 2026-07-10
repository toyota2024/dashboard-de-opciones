import type { MarketTimeframeKey } from "../types.js";

export type MarketTimeframeConfig = {
  key: MarketTimeframeKey;
  alpacaTimeframe: "5Min" | "30Min" | "1Day";
  lookbackDays: number;
  limit: number;
};

const defaultTimeframeKey: MarketTimeframeKey = "3M_1D";

const timeframeConfigs: Record<MarketTimeframeKey, MarketTimeframeConfig> = {
  "5D_5M": {
    key: "5D_5M",
    alpacaTimeframe: "5Min",
    lookbackDays: 7,
    limit: 500,
  },
  "30D_30M": {
    key: "30D_30M",
    alpacaTimeframe: "30Min",
    lookbackDays: 35,
    limit: 500,
  },
  "3M_1D": {
    key: "3M_1D",
    alpacaTimeframe: "1Day",
    lookbackDays: 100,
    limit: 100,
  },
};

export function resolveMarketTimeframe(key: string | undefined): MarketTimeframeConfig {
  if (key === "5D_5M" || key === "30D_30M" || key === "3M_1D") {
    return timeframeConfigs[key];
  }

  return timeframeConfigs[defaultTimeframeKey];
}

export function getStartDateForTimeframe(config: MarketTimeframeConfig): string {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - config.lookbackDays);
  start.setUTCHours(0, 0, 0, 0);

  return start.toISOString();
}
