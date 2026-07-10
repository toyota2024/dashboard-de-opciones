export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number, signed = true): string {
  return `${signed && value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatDateLabel(value: string): string {
  return value;
}
