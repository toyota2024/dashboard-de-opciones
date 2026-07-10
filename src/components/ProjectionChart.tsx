import { CandlestickChart } from "./CandlestickChart";
import { InfoTooltip } from "./InfoTooltip";
import { getDataSourceCopy } from "../lib/dataSourceCopy";
import type {
  ActiveView,
  DataSourceStatus,
  ExpectedMove,
  MarketTimeframeMetadata,
  OptionLevels,
  PricePoint,
  SelectedTimeframe,
} from "../types/options";

type ProjectionChartProps = {
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  expectedMove: ExpectedMove;
  levels: OptionLevels;
  ticker: string;
  dataSource: DataSourceStatus;
  selectedTimeframe: SelectedTimeframe;
  activeView: ActiveView;
  marketTimeframe?: MarketTimeframeMetadata;
  useLocalTimeframeFilter?: boolean;
};

export function ProjectionChart({
  historicalPath,
  projectedPath,
  expectedMove,
  levels,
  ticker,
  dataSource,
  selectedTimeframe,
  activeView,
  marketTimeframe,
  useLocalTimeframeFilter = false,
}: ProjectionChartProps) {
  const copy = getDataSourceCopy(dataSource);
  const visibleHistory = useLocalTimeframeFilter ? getVisibleHistory(historicalPath, selectedTimeframe) : historicalPath;
  const showProjectionOverlays = activeView === "projections";
  const timeframeLabel = getTimeframeLabel(selectedTimeframe);
  const candlesLoaded = useLocalTimeframeFilter ? visibleHistory.length : (marketTimeframe?.candlesReturned ?? visibleHistory.length);

  return (
    <section className="chart-shell" aria-label={copy.chartTitle}>
      <div className="chart-title-row">
        <div>
          <p className="terminal-label">{copy.chartTitle}</p>
          <h2>{ticker} OHLCV market structure and projected pressure path</h2>
        </div>
        <span className="data-pill">{copy.chartBadge}</span>
      </div>

      <div className="chart-view-note">
        <strong>Current market timeframe: {timeframeLabel}</strong>
        <span>{getMarketTimeframeNote(dataSource, marketTimeframe)}</span>
        <span>Candles loaded: {candlesLoaded}</span>
        {activeView === "supportResistance" && (
          <span>Support / Resistance view focuses on key option-derived levels. In hybrid mode, these levels are simulated.</span>
        )}
      </div>

      <div className="chart-canvas">
        <CandlestickChart
          historicalPath={visibleHistory}
          projectedPath={projectedPath}
          levels={levels}
          expectedMove={expectedMove}
          showProjectionOverlays={showProjectionOverlays}
          ticker={ticker}
          selectedTimeframe={selectedTimeframe}
          marketLabel={getMarketTimeframeNote(dataSource, marketTimeframe)}
          candlesLoaded={candlesLoaded}
        />
      </div>

      <div className="chart-legend" aria-label="Chart legend">
        <span className="legend-item legend-item--spot">
          <InfoTooltip termKey="spot" compact />
        </span>
        <span className="legend-item legend-item--support">
          <InfoTooltip termKey="support" compact />
        </span>
        <span className="legend-item legend-item--resistance">
          <InfoTooltip termKey="resistance" compact />
        </span>
        <span className="legend-item legend-item--max-pain">
          <InfoTooltip termKey="maxPain" compact />
        </span>
        <span className="legend-item legend-item--gold">
          <InfoTooltip termKey="oneSigma" label="Gold cone 1σ expected move" compact />
        </span>
        <span className="legend-item legend-item--blue">
          <InfoTooltip termKey="twoSigma" label="Blue cone 2σ stress range" compact />
        </span>
      </div>
    </section>
  );
}

function getVisibleHistory(historicalPath: PricePoint[], selectedTimeframe: SelectedTimeframe): PricePoint[] {
  const limits: Record<SelectedTimeframe, number> = {
    "5D_5M": 5,
    "30D_30M": 30,
    "3M_1D": 60,
  };

  return historicalPath.slice(-limits[selectedTimeframe]);
}

function getTimeframeLabel(selectedTimeframe: SelectedTimeframe): string {
  const labels: Record<SelectedTimeframe, string> = {
    "5D_5M": "5D / 5M",
    "30D_30M": "30D / 30M",
    "3M_1D": "3M / 1D",
  };

  return labels[selectedTimeframe];
}

function getMarketTimeframeNote(dataSource: DataSourceStatus, marketTimeframe?: MarketTimeframeMetadata): string {
  if (dataSource.marketData === "real") {
    return `Market candles loaded from Alpaca using ${marketTimeframe?.alpacaTimeframe ?? "selected"} bars.`;
  }

  return "Mock mode uses simulated candles for timeframe preview.";
}
