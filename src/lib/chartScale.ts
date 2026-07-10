import type { ExpectedMove, NormalizedPoint, OptionLevels, PricePoint } from "../types/options";

export function getPriceRange(levels: OptionLevels, expectedMove: ExpectedMove): [number, number] {
  const prices = [
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
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = Math.max((max - min) * 0.03, 20);

  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

export function priceToY(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) {
    return 50;
  }

  return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
}

export function normalizePath(priceSeries: PricePoint[], minPrice: number, maxPrice: number): NormalizedPoint[] {
  return priceSeries.flatMap((point) => {
    const price = point.price ?? point.close ?? point.projection;

    if (price === undefined) {
      return [];
    }

    return [{ date: point.date, price, y: priceToY(price, minPrice, maxPrice) }];
  });
}
