import type { ModelConfig, OptionContract, PricePoint, RawOptionProjectionInput, SelectedTimeframe } from "../types/options";

export type DataProviderRequestOptions = {
  timeframe?: SelectedTimeframe;
};

export type MarketQuote = {
  ticker: string;
  price: number;
  changePercent: number;
  latestCandle: string;
};

export type HistoricalPricePoint = {
  timestamp: string;
  date?: string;
  close: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
};

export type OptionsProviderResponse = {
  ticker: string;
  quote: MarketQuote;
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  optionChain: OptionContract[];
  selectedDteRange: [number, number];
  modelConfig: ModelConfig;
};

export type DataProvider = {
  name: string;
  getUniverse(options?: DataProviderRequestOptions): Promise<RawOptionProjectionInput[]>;
  getTickerData(ticker: string, options?: DataProviderRequestOptions): Promise<RawOptionProjectionInput | null>;
};
