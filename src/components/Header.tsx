import type { ActiveView, HeaderSnapshot, SelectedTimeframe } from "../types/options";
import { t, type Language } from "../lib/i18n";
import { MetricChip } from "./MetricChip";

type HeaderProps = {
  snapshot: HeaderSnapshot;
  selectedTimeframe: SelectedTimeframe;
  activeView: ActiveView;
  language: Language;
  onTimeframeChange: (timeframe: SelectedTimeframe) => void;
  onActiveViewChange: (view: ActiveView) => void;
};

const primaryTimeframes: Array<{ key: SelectedTimeframe; label: Record<Language, string> }> = [
  { key: "1D_1M", label: { es: "1D / 1m", en: "1D / 1m" } },
  { key: "5D_15M", label: { es: "5D / 15m", en: "5D / 15m" } },
  { key: "3M_4H", label: { es: "3M / 4H", en: "3M / 4H" } },
  { key: "1Y_1D", label: { es: "1A / 1D", en: "1Y / 1D" } },
];
const viewKeys: ActiveView[] = ["projections", "supportResistance"];

export function Header({
  snapshot,
  selectedTimeframe,
  activeView,
  language,
  onTimeframeChange,
  onActiveViewChange,
}: HeaderProps) {
  return (
    <header className="top-header">
      <div className="brand-block">
        <p className="terminal-label">{t("optionsProjectionConsole", language)}</p>
        <h1>{snapshot.agentName}</h1>
      </div>

      <div className="snapshot-strip" aria-label="Current market snapshot">
        <MetricChip label={t("ticker", language)} value={snapshot.ticker} tone="blue" />
        <MetricChip label={t("price", language)} value={snapshot.formattedPrice} />
        <MetricChip label={t("change", language)} value={snapshot.formattedChange} tone="positive" />
        <MetricChip label={t("lastCandle", language)} value={snapshot.formattedLastCandleDate} />
      </div>

      <nav className="control-cluster" aria-label="Chart controls">
        <div className="segmented-control" aria-label="Timeframe">
          {primaryTimeframes.map((timeframe) => (
            <button
              aria-pressed={selectedTimeframe === timeframe.key}
              className={`toggle-button ${selectedTimeframe === timeframe.key ? "active" : ""}`}
              key={timeframe.key}
              onClick={() => onTimeframeChange(timeframe.key)}
              type="button"
            >
              {timeframe.label[language]}
            </button>
          ))}
        </div>
        <div className="segmented-control segmented-control--layers" aria-label="Chart layers">
          {snapshot.layers.map((layer, index) => (
            <button
              aria-pressed={activeView === viewKeys[index]}
              className={`view-toggle-button ${activeView === viewKeys[index] ? "active" : ""}`}
              key={layer}
              onClick={() => onActiveViewChange(viewKeys[index])}
              type="button"
            >
              {index === 0 ? t("projections", language) : t("supportResistance", language)}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
