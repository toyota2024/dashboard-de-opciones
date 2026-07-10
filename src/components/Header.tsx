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

const timeframeKeys: SelectedTimeframe[] = ["5D_5M", "30D_30M", "3M_1D"];
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
          {snapshot.timeframes.map((timeframe, index) => (
            <button
              aria-pressed={selectedTimeframe === timeframeKeys[index]}
              className={`toggle-button ${selectedTimeframe === timeframeKeys[index] ? "active" : ""}`}
              key={timeframe.label}
              onClick={() => onTimeframeChange(timeframeKeys[index])}
              type="button"
            >
              {timeframe.label}
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
