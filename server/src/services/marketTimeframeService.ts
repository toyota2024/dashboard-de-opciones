import type { MarketTimeframeKey } from "../types.js";

export type MarketTimeframeConfig = {
  key: MarketTimeframeKey;
  alpacaTimeframe: "1Min" | "5Min" | "15Min" | "30Min" | "1Hour" | "1Day";
  displayInterval: "1m" | "5m" | "15m" | "30m" | "4H" | "1D";
  lookbackDays: number;
  limit: number;
  resampleToHours?: 4;
};

const defaultTimeframeKey: MarketTimeframeKey = "5D_15M";

const timeframeConfigs: Record<MarketTimeframeKey, MarketTimeframeConfig> = {
  "1D_1M": {
    key: "1D_1M",
    alpacaTimeframe: "1Min",
    displayInterval: "1m",
    lookbackDays: 2,
    limit: 1000,
  },
  "5D_15M": {
    key: "5D_15M",
    alpacaTimeframe: "15Min",
    displayInterval: "15m",
    lookbackDays: 7,
    limit: 500,
  },
  "3M_4H": {
    key: "3M_4H",
    alpacaTimeframe: "1Hour",
    displayInterval: "4H",
    lookbackDays: 100,
    limit: 1000,
    resampleToHours: 4,
  },
  "1Y_1D": {
    key: "1Y_1D",
    alpacaTimeframe: "1Day",
    displayInterval: "1D",
    lookbackDays: 370,
    limit: 300,
  },
  "5D_5M": {
    key: "5D_5M",
    alpacaTimeframe: "5Min",
    displayInterval: "5m",
    lookbackDays: 7,
    limit: 500,
  },
  "30D_30M": {
    key: "30D_30M",
    alpacaTimeframe: "30Min",
    displayInterval: "30m",
    lookbackDays: 35,
    limit: 500,
  },
  "3M_1D": {
    key: "3M_1D",
    alpacaTimeframe: "1Day",
    displayInterval: "1D",
    lookbackDays: 100,
    limit: 100,
  },
};

export function resolveMarketTimeframe(key: string | undefined): MarketTimeframeConfig {
  if (
    key === "1D_1M" ||
    key === "5D_15M" ||
    key === "3M_4H" ||
    key === "1Y_1D" ||
    key === "5D_5M" ||
    key === "30D_30M" ||
    key === "3M_1D"
  ) {
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
