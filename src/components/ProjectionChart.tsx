import { useState } from "react";
import { CandlestickChart } from "./CandlestickChart";
import { InfoTooltip } from "./InfoTooltip";
import { getDataSourceCopy } from "../lib/dataSourceCopy";
import type { Language } from "../lib/i18n";
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
  language?: Language;
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
  language = "en",
}: ProjectionChartProps) {
  const [scaleMode, setScaleMode] = useState<"price" | "projection">("price");
  const copy = getDataSourceCopy(dataSource, language);
  const visibleHistory = useLocalTimeframeFilter ? getVisibleHistory(historicalPath, selectedTimeframe) : historicalPath;
  const showProjectionOverlays = activeView === "projections";
  const timeframeLabel = getTimeframeLabel(selectedTimeframe);
  const candlesLoaded = useLocalTimeframeFilter ? visibleHistory.length : (marketTimeframe?.candlesReturned ?? visibleHistory.length);

  return (
    <section className="chart-shell" aria-label={copy.chartTitle}>
      <div className="chart-title-row">
        <div>
          <p className="terminal-label">{copy.chartTitle}</p>
          <h2>{language === "es" ? `${ticker} velas reales + niveles simulados de opciones` : `${ticker} real candles + simulated options levels`}</h2>
        </div>
        <span className="data-pill">{copy.chartBadge}</span>
      </div>

      <div className="chart-view-note">
        <strong>{language === "es" ? "Temporalidad actual" : "Current market timeframe"}: {timeframeLabel}</strong>
        <span>{getMarketTimeframeNote(dataSource, marketTimeframe, language)}</span>
        <span>{language === "es" ? "Velas cargadas" : "Candles loaded"}: {candlesLoaded}</span>
        {marketTimeframe?.warning === "LIMITED_INTRADAY_DATA" && (
          <span className="chart-warning-note">
            {language === "es" ? "Datos intradía limitados para esta temporalidad." : "Limited intraday data for this timeframe."}
          </span>
        )}
        {activeView === "supportResistance" && (
          <span>
            {language === "es"
              ? "La vista Soporte / Resistencia enfoca niveles derivados de opciones. En modo hibrido, estos niveles son simulados."
              : "Support / Resistance view focuses on key option-derived levels. In hybrid mode, these levels are simulated."}
          </span>
        )}
        <div className="scale-toggle" aria-label={language === "es" ? "Escala del chart" : "Chart scale"}>
          <button className={scaleMode === "price" ? "is-active" : ""} onClick={() => setScaleMode("price")} type="button">
            {language === "es" ? "Escala precio" : "Price scale"}
          </button>
          <button className={scaleMode === "projection" ? "is-active" : ""} onClick={() => setScaleMode("projection")} type="button">
            {language === "es" ? "Escala proyeccion" : "Projection scale"}
          </button>
        </div>
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
          marketLabel={getMarketTimeframeNote(dataSource, marketTimeframe, language)}
          candlesLoaded={candlesLoaded}
          scaleMode={scaleMode}
          language={language}
        />
      </div>

      <div className="chart-legend" aria-label="Chart legend">
        <span className="legend-item legend-item--spot">
          <InfoTooltip termKey="spot" label={language === "es" ? "Precio actual" : "Current price"} compact />
        </span>
        <span className="legend-item legend-item--support">
          <InfoTooltip termKey="support" label={language === "es" ? "Piso / Put Wall" : "Floor / Put Wall"} compact />
        </span>
        <span className="legend-item legend-item--resistance">
          <InfoTooltip termKey="resistance" label={language === "es" ? "Techo / Call Wall" : "Ceiling / Call Wall"} compact />
        </span>
        <span className="legend-item legend-item--max-pain">
          <InfoTooltip termKey="maxPain" compact />
        </span>
        <span className="legend-item legend-item--projection">
          {language === "es" ? "Proyeccion base" : "Base projection"}
        </span>
        <span className="legend-item legend-item--gold">
          <InfoTooltip termKey="oneSigma" label={language === "es" ? "Rango esperado 1σ" : "Expected range 1σ"} compact />
        </span>
        <span className="legend-item legend-item--blue">
          <InfoTooltip termKey="twoSigma" label={language === "es" ? "Rango de estres 2σ" : "Stress range 2σ"} compact />
        </span>
      </div>
    </section>
  );
}

function getVisibleHistory(historicalPath: PricePoint[], selectedTimeframe: SelectedTimeframe): PricePoint[] {
  const limits: Record<SelectedTimeframe, number> = {
    "1D_1M": 240,
    "5D_15M": 160,
    "3M_4H": 140,
    "1Y_1D": 180,
    "5D_5M": 5,
    "30D_30M": 30,
    "3M_1D": 60,
  };

  return historicalPath.slice(-limits[selectedTimeframe]);
}

function getTimeframeLabel(selectedTimeframe: SelectedTimeframe): string {
  const labels: Record<SelectedTimeframe, string> = {
    "1D_1M": "1D / 1m",
    "5D_15M": "5D / 15m",
    "3M_4H": "3M / 4H",
    "1Y_1D": "1Y / 1D",
    "5D_5M": "5D / 5M",
    "30D_30M": "30D / 30M",
    "3M_1D": "3M / 1D",
  };

  return labels[selectedTimeframe];
}

function getMarketTimeframeNote(dataSource: DataSourceStatus, marketTimeframe?: MarketTimeframeMetadata, language: Language = "en"): string {
  if (dataSource.marketData === "real") {
    return language === "es"
      ? `Velas de mercado cargadas desde Alpaca usando barras de ${marketTimeframe?.alpacaTimeframe ?? "la temporalidad seleccionada"}.`
      : `Market candles loaded from Alpaca using ${marketTimeframe?.alpacaTimeframe ?? "selected"} bars.`;
  }

  return language === "es"
    ? "Modo simulacion usa velas simuladas para previsualizar temporalidades."
    : "Mock mode uses simulated candles for timeframe preview.";
}
