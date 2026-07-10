import { createMockOptionChain } from "./createMockOptionChain";
import type { ModelConfig, PricePoint, RawOptionProjectionInput } from "../types/options";

const expirations = [
  { expiration: "2026-07-10", dte: 16 },
  { expiration: "2026-07-17", dte: 23 },
  { expiration: "2026-07-24", dte: 30 },
];

const defaultModelConfig: ModelConfig = {
  minOpenInterest: 450,
  minVolume: 60,
  maxBidAskSpreadPercent: 0.18,
  maxThetaPercentOfPremium: 0.08,
  preferredDteMin: 16,
  preferredDteMax: 30,
};

type TickerMockConfig = {
  ticker: string;
  spot: number;
  changePercent: number;
  baseIv: number;
  strikeMin: number;
  strikeMax: number;
  strikeStep: number;
  callWallStrike: number;
  putWallStrike: number;
  maxPainBiasStrike: number;
  callSkew?: number;
  putSkew?: number;
  volumeMultiplier?: number;
  trend: "bullish" | "neutral" | "volatile" | "stable" | "risky";
};

const tickerConfigs: TickerMockConfig[] = [
  {
    ticker: "MU",
    spot: 1190.02,
    changePercent: 13.5,
    baseIv: 0.29,
    strikeMin: 800,
    strikeMax: 1450,
    strikeStep: 50,
    callWallStrike: 1200,
    putWallStrike: 1000,
    maxPainBiasStrike: 850,
    trend: "neutral",
  },
  {
    ticker: "AMD",
    spot: 164.4,
    changePercent: 3.2,
    baseIv: 0.34,
    strikeMin: 110,
    strikeMax: 220,
    strikeStep: 10,
    callWallStrike: 160,
    putWallStrike: 145,
    maxPainBiasStrike: 155,
    callSkew: 1.18,
    trend: "bullish",
  },
  {
    ticker: "NVDA",
    spot: 154.8,
    changePercent: 5.8,
    baseIv: 0.38,
    strikeMin: 100,
    strikeMax: 220,
    strikeStep: 10,
    callWallStrike: 150,
    putWallStrike: 135,
    maxPainBiasStrike: 150,
    callSkew: 1.35,
    putSkew: 0.82,
    volumeMultiplier: 1.18,
    trend: "bullish",
  },
  {
    ticker: "TSLA",
    spot: 322.3,
    changePercent: -2.1,
    baseIv: 0.58,
    strikeMin: 220,
    strikeMax: 460,
    strikeStep: 20,
    callWallStrike: 380,
    putWallStrike: 280,
    maxPainBiasStrike: 300,
    callSkew: 1.08,
    putSkew: 1.18,
    volumeMultiplier: 1.08,
    trend: "volatile",
  },
  {
    ticker: "AAPL",
    spot: 214.65,
    changePercent: 0.8,
    baseIv: 0.22,
    strikeMin: 170,
    strikeMax: 260,
    strikeStep: 10,
    callWallStrike: 230,
    putWallStrike: 200,
    maxPainBiasStrike: 210,
    callSkew: 0.95,
    putSkew: 0.95,
    volumeMultiplier: 1.22,
    trend: "stable",
  },
  {
    ticker: "HOOD",
    spot: 87.25,
    changePercent: 8.9,
    baseIv: 0.74,
    strikeMin: 50,
    strikeMax: 130,
    strikeStep: 5,
    callWallStrike: 105,
    putWallStrike: 70,
    maxPainBiasStrike: 80,
    callSkew: 1.22,
    putSkew: 1.12,
    volumeMultiplier: 0.76,
    trend: "risky",
  },
];

export const mockUniverse: RawOptionProjectionInput[] = tickerConfigs.map((config) => ({
  quote: {
    agentName: "AI Option Agent",
    ticker: config.ticker,
    price: config.spot,
    changePercent: config.changePercent,
    lastCandleDate: "6/24/2026",
    timeframes: [
      { label: "5D / 5M", range: "5D", interval: "5M" },
      { label: "30D / 30M", range: "30D", interval: "30M" },
      { label: "3M / 1D", range: "3M", interval: "1D" },
    ],
    layers: ["Projections", "Support / Resistance"],
  },
  historicalPath: buildHistoricalPath(config.spot, config.trend),
  projectedPath: [
    { date: "7/24" },
    { date: "8/24" },
    { date: "9/24" },
    { date: "10/24" },
    { date: "11/24" },
    { date: "12/24" },
  ],
  optionChain: createMockOptionChain({
    ticker: config.ticker,
    spot: config.spot,
    expirations,
    strikeMin: config.strikeMin,
    strikeMax: config.strikeMax,
    strikeStep: config.strikeStep,
    callWallStrike: config.callWallStrike,
    putWallStrike: config.putWallStrike,
    maxPainBiasStrike: config.maxPainBiasStrike,
    baseIv: config.baseIv,
    callSkew: config.callSkew,
    putSkew: config.putSkew,
    volumeMultiplier: config.volumeMultiplier,
  }),
  selectedDteRange: [16, 30],
  modelConfig: defaultModelConfig,
}));

function buildHistoricalPath(spot: number, trend: TickerMockConfig["trend"]): PricePoint[] {
  const multipliersByTrend: Record<TickerMockConfig["trend"], number[]> = {
    bullish: [0.76, 0.79, 0.82, 0.86, 0.9, 0.93, 0.96, 0.98, 1],
    neutral: [0.68, 0.7, 0.69, 0.73, 0.77, 0.82, 0.88, 0.94, 1],
    volatile: [0.86, 0.94, 0.82, 0.99, 0.9, 1.07, 0.96, 1.04, 1],
    stable: [0.94, 0.95, 0.96, 0.965, 0.972, 0.981, 0.989, 0.995, 1],
    risky: [0.58, 0.71, 0.66, 0.84, 0.78, 0.95, 0.9, 1.08, 1],
  };
  const dates = ["4/01", "4/12", "4/24", "5/06", "5/18", "5/30", "6/10", "6/18", "6/24"];

  return multipliersByTrend[trend].map((multiplier, index) => ({
    ...buildCandle({
      close: spot * multiplier,
      previousClose: spot * multipliersByTrend[trend][Math.max(0, index - 1)],
      date: dates[index],
      index,
      trend,
      spot,
    }),
  }));
}

function buildCandle({
  close,
  previousClose,
  date,
  index,
  trend,
  spot,
}: {
  close: number;
  previousClose: number;
  date: string;
  index: number;
  trend: TickerMockConfig["trend"];
  spot: number;
}): PricePoint {
  const volatilityByTrend: Record<TickerMockConfig["trend"], number> = {
    bullish: 0.018,
    neutral: 0.022,
    volatile: 0.045,
    stable: 0.009,
    risky: 0.062,
  };
  const volatility = volatilityByTrend[trend];
  const roundedClose = round(close, 2);
  const open = round(previousClose * (1 + ((index % 3) - 1) * volatility * 0.32), 2);
  const high = round(Math.max(open, roundedClose) * (1 + volatility * (0.65 + (index % 4) * 0.12)), 2);
  const low = round(Math.min(open, roundedClose) * (1 - volatility * (0.56 + (index % 5) * 0.08)), 2);
  const volumeBase = trend === "stable" ? 18_000_000 : trend === "risky" ? 62_000_000 : trend === "volatile" ? 48_000_000 : 32_000_000;
  const volume = Math.round(volumeBase * (0.72 + index * 0.045 + Math.abs(roundedClose - open) / Math.max(spot, 1)));

  return {
    date,
    timestamp: `2026-${date.replace("/", "-").padStart(5, "0")}`,
    open,
    high,
    low,
    close: roundedClose,
    volume,
    price: roundedClose,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
