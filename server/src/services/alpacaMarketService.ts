import {
  chooseServerMockBaseIv,
  chooseServerMockStrikeStep,
  createServerMockOptionChain,
} from "./mockOptionChainFactory.js";
import { getStartDateForTimeframe, resolveMarketTimeframe } from "./marketTimeframeService.js";
import type { MarketTimeframeKey, PricePoint, QuoteSnapshot, RawOptionProjectionInput } from "../types.js";

type AlpacaBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type AlpacaSnapshot = {
  latestTrade?: { p?: number; t?: string };
  latestQuote?: { ap?: number; bp?: number; t?: string };
  dailyBar?: AlpacaBar;
  prevDailyBar?: AlpacaBar;
};

type AlpacaBarsResponse = {
  bars?: AlpacaBar[];
};

type AlpacaLatestQuote = {
  ticker: string;
  price: number;
  changePercent: number;
  latestCandle: string;
};

type HistoricalBarsOptions = {
  timeframe?: "5Min" | "30Min" | "1Day";
  start?: string;
  end?: string;
  limit?: number;
};

const defaultModelConfig = {
  minOpenInterest: 450,
  minVolume: 60,
  maxBidAskSpreadPercent: 0.18,
  maxThetaPercentOfPremium: 0.08,
  preferredDteMin: 16,
  preferredDteMax: 30,
};

export class AlpacaMarketDataError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function alpacaFetch<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;
  const baseUrl = process.env.ALPACA_MARKET_DATA_BASE_URL ?? "https://data.alpaca.markets";

  if (!apiKey || !secretKey || apiKey.includes("PEGAR_AQUI") || secretKey.includes("PEGAR_AQUI")) {
    throw new AlpacaMarketDataError("Missing Alpaca credentials in server/.env", 502);
  }

  const url = new URL(path, baseUrl);
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });
  } catch {
    throw new AlpacaMarketDataError("Alpaca market data unavailable", 502);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AlpacaMarketDataError("Alpaca authentication failed", 502);
  }

  if (response.status === 404) {
    throw new AlpacaMarketDataError("Ticker not found or no market data", 404);
  }

  if (!response.ok) {
    throw new AlpacaMarketDataError("Alpaca market data unavailable", 502);
  }

  return response.json() as Promise<T>;
}

export async function getAlpacaLatestQuote(ticker: string): Promise<AlpacaLatestQuote> {
  const snapshot = await alpacaFetch<AlpacaSnapshot>(`/v2/stocks/${encodeURIComponent(ticker)}/snapshot`);
  const price = snapshot.latestTrade?.p ?? midpoint(snapshot.latestQuote?.bp, snapshot.latestQuote?.ap) ?? snapshot.dailyBar?.c;

  if (!price) {
    throw new AlpacaMarketDataError("Ticker not found or no market data", 404);
  }

  const previousClose = snapshot.prevDailyBar?.c;
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  const latestCandle = snapshot.dailyBar?.t ?? snapshot.latestTrade?.t ?? snapshot.latestQuote?.t ?? new Date().toISOString();

  return {
    ticker,
    price,
    changePercent,
    latestCandle,
  };
}

export async function getAlpacaHistoricalBars(ticker: string, options: HistoricalBarsOptions = {}): Promise<PricePoint[]> {
  const limit = options.limit ?? 60;
  const timeframe = options.timeframe ?? "1Day";
  const start = options.start ?? getDefaultStart(limit);
  const queryParams: Record<string, string> = {
    timeframe,
    start,
    limit: String(limit),
    adjustment: "raw",
  };

  if (options.end) {
    queryParams.end = options.end;
  }

  const response = await alpacaFetch<AlpacaBarsResponse>(`/v2/stocks/${encodeURIComponent(ticker)}/bars`, queryParams);
  const bars = response.bars ?? [];

  if (bars.length === 0) {
    throw new AlpacaMarketDataError("Alpaca returned no bars for the selected timeframe.", 404);
  }

  return bars.slice(-limit).map((bar) => ({
    date: formatDateLabel(bar.t),
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
    price: bar.c,
  }));
}

export async function getAlpacaMarketProjectionInput(
  ticker: string,
  timeframeKey: MarketTimeframeKey = "3M_1D",
): Promise<RawOptionProjectionInput> {
  const marketTimeframeConfig = resolveMarketTimeframe(timeframeKey);
  const [latestQuote, historicalPath] = await Promise.all([
    getAlpacaLatestQuote(ticker),
    getAlpacaHistoricalBars(ticker, {
      timeframe: marketTimeframeConfig.alpacaTimeframe,
      start: getStartDateForTimeframe(marketTimeframeConfig),
      limit: marketTimeframeConfig.limit,
    }),
  ]);
  const latestBar = historicalPath[historicalPath.length - 1];
  const previousBar = historicalPath[historicalPath.length - 2];
  const price = latestQuote.price || latestBar?.close;

  if (!price) {
    throw new AlpacaMarketDataError("Ticker not found or no market data", 404);
  }

  const changePercent =
    latestBar?.close !== undefined && previousBar?.close
      ? ((latestBar.close - previousBar.close) / previousBar.close) * 100
      : latestQuote.changePercent;
  const quote = buildQuoteSnapshot({
    ticker,
    price,
    changePercent,
    latestCandle: latestBar?.timestamp ?? latestQuote.latestCandle,
  });
  const strikeStep = chooseServerMockStrikeStep(price);

  return {
    quote,
    historicalPath,
    projectedPath: [{ date: "7/24" }, { date: "8/24" }, { date: "9/24" }, { date: "10/24" }, { date: "11/24" }, { date: "12/24" }],
    optionChain: createServerMockOptionChain({
      ticker,
      spot: price,
      dteList: [16, 23, 30],
      strikeStep,
      baseIv: chooseServerMockBaseIv(ticker),
    }),
    selectedDteRange: [16, 30],
    modelConfig: defaultModelConfig,
    dataSource: {
      marketData: "real",
      marketDataProvider: "alpaca",
      optionsData: "mock",
      optionsDataProvider: "mock",
      lastUpdated: new Date().toISOString(),
    },
    marketTimeframe: {
      ...marketTimeframeConfig,
      candlesReturned: historicalPath.length,
    },
  };
}

export function buildQuoteSnapshot(input: AlpacaLatestQuote): QuoteSnapshot {
  return {
    agentName: "AI Option Agent",
    ticker: input.ticker,
    price: input.price,
    changePercent: input.changePercent,
    lastCandleDate: formatDateLabel(input.latestCandle),
    timeframes: [
      { label: "5D / 5M", range: "5D", interval: "5M" },
      { label: "30D / 30M", range: "30D", interval: "30M" },
      { label: "3M / 1D", range: "3M", interval: "1D" },
    ],
    layers: ["Projections", "Support / Resistance"],
  };
}

function midpoint(bid?: number, ask?: number): number | undefined {
  if (bid === undefined || ask === undefined) return undefined;

  return (bid + ask) / 2;
}

function formatDateLabel(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}

function getDefaultStart(limit: number): string {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - Math.max(limit * 2, 90));
  start.setUTCHours(0, 0, 0, 0);

  return start.toISOString();
}
