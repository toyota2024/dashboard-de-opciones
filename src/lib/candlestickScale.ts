import type { ExpectedMove, OptionLevels, PricePoint } from "../types/options";

export type NormalizedCandle = Required<Pick<PricePoint, "date" | "open" | "high" | "low" | "close" | "volume">> & {
  timestamp: string;
};

export function getOhlcPriceRange(candles: PricePoint[], levels: OptionLevels, expectedMove: ExpectedMove): [number, number] {
  const candlePrices = normalizeCandles(candles).flatMap((candle) => [candle.high, candle.low]);
  const overlayPrices = [
    levels.spot,
    levels.support,
    levels.resistance,
    levels.maxPain,
    expectedMove.low1Sigma,
    expectedMove.base,
    expectedMove.high1Sigma,
    expectedMove.stressLow2Sigma,
    expectedMove.stressHigh2Sigma,
  ];
  const prices = [...candlePrices, ...overlayPrices];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = Math.max((max - min) * 0.04, 1);

  return [Math.floor(min - padding), Math.ceil(max + padding)];
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
