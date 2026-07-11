import type { ExpectedMove, OptionLevels, PricePoint, SelectedTimeframe } from "../types/options";

export type NormalizedCandle = Required<Pick<PricePoint, "date" | "open" | "high" | "low" | "close" | "volume">> & {
  timestamp: string;
};

export function getOhlcPriceRange(
  candles: PricePoint[],
  levels: OptionLevels,
  expectedMove: ExpectedMove,
  mode: "price" | "projection" = "price",
  timeframe: SelectedTimeframe = "5D_15M",
): [number, number] {
  const normalizedCandles = normalizeCandles(candles);
  const candlePrices = normalizedCandles.flatMap((candle) => [candle.high, candle.low]);
  const overlayPrices = [levels.spot, levels.support, levels.resistance, levels.maxPain];
  const projectionPrices = [
    expectedMove.low1Sigma,
    expectedMove.base,
    expectedMove.high1Sigma,
    expectedMove.stressLow2Sigma,
    expectedMove.stressHigh2Sigma,
  ];

  if (mode === "price") {
    const prices = [...candlePrices, levels.spot, ...getNearbyOptionLevels(normalizedCandles, levels, timeframe)];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = getPriceModePadding(min, max, levels.spot);

    return [roundDown(min - padding), roundUp(max + padding)];
  }

  // Projection mode intentionally includes the full simulated options map.
  const prices =
    candlePrices.length > 0 ? [...candlePrices, ...overlayPrices, ...projectionPrices] : [...overlayPrices, ...projectionPrices];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = Math.max((max - min) * 0.04, 1);

  return [roundDown(min - padding), roundUp(max + padding)];
}

function getNearbyOptionLevels(
  candles: NormalizedCandle[],
  levels: OptionLevels,
  timeframe: SelectedTimeframe,
): number[] {
  if (candles.length === 0) return [];

  const tolerance = getTimeframeLevelTolerance(timeframe);
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const reference = levels.spot || candles[candles.length - 1]?.close || 0;
  const lowerBound = reference * (1 - tolerance);
  const upperBound = reference * (1 + tolerance);

  return [levels.support, levels.resistance, levels.maxPain].filter(
    (price) => price >= lowerBound && price <= upperBound && price >= low * (1 - tolerance) && price <= high * (1 + tolerance),
  );
}

function getTimeframeLevelTolerance(timeframe: SelectedTimeframe): number {
  const tolerances: Record<SelectedTimeframe, number> = {
    "1D_1M": 0.02,
    "5D_15M": 0.04,
    "3M_4H": 0.08,
    "1Y_1D": 0.12,
    "5D_5M": 0.02,
    "30D_30M": 0.04,
    "3M_1D": 0.08,
  };

  return tolerances[timeframe] ?? 0.04;
}

function getPriceModePadding(min: number, max: number, spot: number): number {
  const range = Math.max(max - min, Math.abs(spot) * 0.001, 0.01);

  return Math.max(range * 0.18, Math.abs(spot) * 0.0008, 0.05);
}

function roundDown(value: number): number {
  return Math.floor(value * 100) / 100;
}

function roundUp(value: number): number {
  return Math.ceil(value * 100) / 100;
}

export function priceToChartY(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) {
    return 50;
  }

  return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
}

export function indexToChartX(index: number, total: number, width: number): number {
  if (total <= 1) {
    return width / 2;
  }

  return (index / (total - 1)) * width;
}

export function normalizeCandles(candles: PricePoint[]): NormalizedCandle[] {
  return candles.flatMap((point) => {
    const close = point.close ?? point.price;

    if (
      point.open === undefined ||
      point.high === undefined ||
      point.low === undefined ||
      close === undefined ||
      point.volume === undefined
    ) {
      return [];
    }

    return [
      {
        date: point.date,
        timestamp: point.timestamp ?? point.date,
        open: point.open,
        high: point.high,
        low: point.low,
        close,
        volume: point.volume,
      },
    ];
  });
}
