import {
  chooseServerMockBaseIv,
  chooseServerMockStrikeStep,
  createServerMockOptionChain,
} from "./mockOptionChainFactory.js";
import { getStartDateForTimeframe, resolveMarketTimeframe } from "./marketTimeframeService.js";
import type { MarketTimeframeConfig } from "./marketTimeframeService.js";
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
  timeframe?: "1Min" | "5Min" | "15Min" | "30Min" | "1Hour" | "1Day";
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

export async function getAlpacaHistoricalBarsForTimeframe(
  ticker: string,
  config: MarketTimeframeConfig,
): Promise<PricePoint[]> {
  const bars = await getAlpacaHistoricalBars(ticker, {
    timeframe: config.alpacaTimeframe,
    start: getStartDateForTimeframe(config),
    limit: config.limit,
  });
  const sessionBars = config.key === "1D_1M" ? filterRegularMarketSession(bars) : bars;

  if (config.resampleToHours === 4) {
    return resamplePricePointsToFourHours(sessionBars).slice(-config.limit);
  }

  return sessionBars;
}

export async function getAlpacaMarketProjectionInput(
  ticker: string,
  timeframeKey: MarketTimeframeKey = "5D_15M",
): Promise<RawOptionProjectionInput> {
  const marketTimeframeConfig = resolveMarketTimeframe(timeframeKey);
  const [latestQuote, historicalPath] = await Promise.all([
    getAlpacaLatestQuote(ticker),
    getAlpacaHistoricalBarsForTimeframe(ticker, marketTimeframeConfig),
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
      warning: getMarketTimeframeWarning(marketTimeframeConfig, historicalPath.length),
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
      { label: "1D / 1m", range: "1D", interval: "1m" },
      { label: "5D / 15m", range: "5D", interval: "15m" },
      { label: "3M / 4H", range: "3M", interval: "4H" },
      { label: "1Y / 1D", range: "1Y", interval: "1D" },
    ],
    layers: ["Projections", "Support / Resistance"],
  };
}

function resamplePricePointsToFourHours(points: PricePoint[]): PricePoint[] {
  const byDay = new Map<string, PricePoint[]>();

  points.forEach((point) => {
    const timestamp = point.timestamp ?? point.date;
    const day = timestamp.slice(0, 10);
    const dayPoints = byDay.get(day) ?? [];
    dayPoints.push(point);
    byDay.set(day, dayPoints);
  });

  return [...byDay.values()].flatMap((dayPoints) => {
    const sorted = [...dayPoints].sort((left, right) => {
      const leftTime = new Date(left.timestamp ?? left.date).getTime();
      const rightTime = new Date(right.timestamp ?? right.date).getTime();

      return leftTime - rightTime;
    });
    const chunks: PricePoint[] = [];

    for (let index = 0; index < sorted.length; index += 4) {
      const block = sorted.slice(index, index + 4);
      const first = block[0];
      const last = block[block.length - 1];
      const high = Math.max(...block.map((point) => point.high ?? point.close ?? point.price ?? 0));
      const low = Math.min(...block.map((point) => point.low ?? point.close ?? point.price ?? 0));
      const volume = block.reduce((total, point) => total + (point.volume ?? 0), 0);
      const close = last.close ?? last.price ?? 0;

      chunks.push({
        date: last.date,
        timestamp: last.timestamp ?? last.date,
        open: first.open ?? first.price ?? close,
        high,
        low,
        close,
        volume,
        price: close,
      });
    }

    return chunks;
  });
}

function getMarketTimeframeWarning(
  config: MarketTimeframeConfig,
  candlesReturned: number,
): "LIMITED_INTRADAY_DATA" | undefined {
  if (config.key === "1D_1M" && candlesReturned < 25) {
    return "LIMITED_INTRADAY_DATA";
  }

  return undefined;
}

function filterRegularMarketSession(points: PricePoint[]): PricePoint[] {
  const sessionPoints = points.filter((point) => isRegularMarketTimestamp(point.timestamp ?? point.date));

  return sessionPoints.length > 0 ? sessionPoints : points;
}

function isRegularMarketTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return true;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const minutes = (hour === 24 ? 0 : hour) * 60 + minute;

  return minutes >= 9 * 60 + 30 && minutes <= 16 * 60;
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
