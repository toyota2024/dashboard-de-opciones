import { mockUniverse } from "../data/mockUniverse";
import type { DataProvider } from "./types";
import type { MarketTimeframeMetadata, RawOptionProjectionInput, SelectedTimeframe } from "../types/options";

export const mockDataProvider: DataProvider = {
  name: "Mock",
  async getUniverse(options) {
    return mockUniverse.map((projection) => withMockDataSource(projection, options?.timeframe));
  },
  async getTickerData(ticker: string, options) {
    const normalizedTicker = ticker.trim().toUpperCase();
    const projection = mockUniverse.find((item) => item.quote.ticker === normalizedTicker);

    return projection ? withMockDataSource(projection, options?.timeframe) : null;
  },
};

function withMockDataSource(projection: RawOptionProjectionInput, timeframe: SelectedTimeframe = "5D_15M"): RawOptionProjectionInput {
  return {
    ...projection,
    dataSource: {
      marketData: "mock",
      marketDataProvider: "mock",
      optionsData: "mock",
      optionsDataProvider: "mock",
      lastUpdated: new Date().toISOString(),
    },
    marketTimeframe: getMockMarketTimeframe(timeframe, projection.historicalPath.length),
  };
}

function getMockMarketTimeframe(timeframe: SelectedTimeframe, candlesReturned: number): MarketTimeframeMetadata {
  const config: Record<SelectedTimeframe, Omit<MarketTimeframeMetadata, "candlesReturned">> = {
    "1D_1M": { key: "1D_1M", alpacaTimeframe: "1Min", displayInterval: "1m", lookbackDays: 2, limit: 1000 },
    "5D_15M": { key: "5D_15M", alpacaTimeframe: "15Min", displayInterval: "15m", lookbackDays: 7, limit: 500 },
    "3M_4H": { key: "3M_4H", alpacaTimeframe: "1Hour", displayInterval: "4H", lookbackDays: 100, limit: 1000 },
    "1Y_1D": { key: "1Y_1D", alpacaTimeframe: "1Day", displayInterval: "1D", lookbackDays: 370, limit: 300 },
    "5D_5M": { key: "5D_5M", alpacaTimeframe: "5Min", lookbackDays: 7, limit: 500 },
    "30D_30M": { key: "30D_30M", alpacaTimeframe: "30Min", lookbackDays: 35, limit: 500 },
    "3M_1D": { key: "3M_1D", alpacaTimeframe: "1Day", lookbackDays: 100, limit: 100 },
  };

  return {
    ...config[timeframe],
    candlesReturned,
  };
}
