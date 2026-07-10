export function calculateEMA(values: number[], period: number): Array<number | null> {
  if (period <= 0 || values.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const result: Array<number | null> = [];
  let ema = 0;

  values.forEach((value, index) => {
    if (index < period - 1) {
      result.push(null);
      ema += value;
      return;
    }

    if (index === period - 1) {
      ema = (ema + value) / period;
      result.push(ema);
      return;
    }

    ema = (value - ema) * multiplier + ema;
    result.push(ema);
  });

  return result;
}
