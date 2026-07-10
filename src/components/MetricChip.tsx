type MetricChipProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "blue";
};

export function MetricChip({ label, value, tone = "neutral" }: MetricChipProps) {
  return (
    <div className={`metric-chip metric-chip--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
