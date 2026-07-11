export type Timeframe = {
  label: string;
  range: string;
  interval: string;
};

export type PrimaryTimeframe = "1D_1M" | "5D_15M" | "3M_4H" | "1Y_1D";
export type LegacyTimeframe = "5D_5M" | "30D_30M" | "3M_1D";
export type MarketTimeframeKey = PrimaryTimeframe | LegacyTimeframe;

export type MarketTimeframeMetadata = {
  key: MarketTimeframeKey;
  alpacaTimeframe: "1Min" | "5Min" | "15Min" | "30Min" | "1Hour" | "1Day";
  displayInterval?: "1m" | "5m" | "15m" | "30m" | "4H" | "1D";
  lookbackDays: number;
  limit: number;
  candlesReturned: number;
  warning?: "LIMITED_INTRADAY_DATA";
};

export type OptionType = "call" | "put";

export type QuoteSnapshot = {
  agentName: string;
  ticker: string;
  price: number;
  changePercent: number;
  lastCandleDate: string;
  timeframes: Timeframe[];
  layers: string[];
};

export type PricePoint = {
  date: string;
  timestamp?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  price?: number;
  projection?: number;
  expectedLow1?: number;
  expectedHigh1?: number;
  stressLow2?: number;
  stressHigh2?: number;
};

export type OptionContract = {
  symbol: string;
  ticker: string;
  expiration: string;
  dte: number;
  strike: number;
  type: OptionType;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
};

export type ModelConfig = {
  minOpenInterest: number;
  minVolume: number;
  maxBidAskSpreadPercent: number;
  maxThetaPercentOfPremium: number;
  preferredDteMin: number;
  preferredDteMax: number;
};

export type RawOptionProjectionInput = {
  quote: QuoteSnapshot;
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  optionChain: OptionContract[];
  selectedDteRange: [number, number];
  modelConfig: ModelConfig;
  dataSource?: DataSourceStatus;
  marketTimeframe?: MarketTimeframeMetadata;
};

export type DataSourceStatus = {
  marketData: "real" | "mock";
  marketDataProvider: "alpaca" | "mock";
  optionsData: "real" | "mock";
  optionsDataProvider: "mock" | "alpaca" | "unknown";
  lastUpdated: string;
};

export type MarketTickerResponse = {
  quote: QuoteSnapshot;
  historicalPath: PricePoint[];
  marketTimeframe?: MarketTimeframeMetadata;
};
