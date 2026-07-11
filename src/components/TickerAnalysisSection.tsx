import { ExpectedMovePanel } from "./ExpectedMovePanel";
import { InfoTooltip } from "./InfoTooltip";
import { ProjectionChart } from "./ProjectionChart";
import { ScenarioPanel } from "./ScenarioPanel";
import { TradeReadPanel } from "./TradeReadPanel";
import { buildOptionsZoneReading } from "../lib/optionsZoneReading";
import type { Language } from "../lib/i18n";
import type { ProviderName } from "../providers/providerRegistry";
import type { ActiveView, ProjectionModel, SelectedTimeframe } from "../types/options";

type TickerAnalysisSectionProps = {
  data: ProjectionModel;
  activeView: ActiveView;
  language: Language;
  providerName: ProviderName;
  selectedTimeframe: SelectedTimeframe;
};

export function TickerAnalysisSection({
  data,
  activeView,
  language,
  providerName,
  selectedTimeframe,
}: TickerAnalysisSectionProps) {
  const zoneReading = buildOptionsZoneReading({
    spot: data.price,
    levels: data.levels,
    projectionHead: data.projectionHead,
    language,
  });

  return (
    <div className="ticker-analysis-section">
      <ProjectionChart
        historicalPath={data.historicalPath}
        projectedPath={data.projectedPath}
        expectedMove={data.expectedMove}
        levels={data.levels}
        ticker={data.ticker}
        dataSource={data.dataSource}
        selectedTimeframe={selectedTimeframe}
        activeView={activeView}
        marketTimeframe={data.marketTimeframe}
        useLocalTimeframeFilter={providerName === "mock"}
        language={language}
      />

      <aside className="side-panel ticker-analysis-side" aria-label="Projection details">
        <section className="projection-head">
          <p className="terminal-label">
            <InfoTooltip termKey="projectionHead" label={language === "es" ? "Cabeza de proyeccion" : "Projection Head"} compact />
          </p>
          <strong>{data.projectionHead}</strong>
          <span>{language === "es" ? "Ruta base 6 meses segun presion de opciones" : data.projectionDescription}</span>
        </section>

        {activeView === "projections" ? (
          <>
            <ScenarioPanel scenarios={data.scenarios} language={language} />
            <ExpectedMovePanel expectedMove={data.expectedMove} language={language} />
          </>
        ) : (
          <section className="side-section">
            <h3>{language === "es" ? "Foco soporte / resistencia" : "Support / Resistance Focus"}</h3>
            <dl className="metric-list">
              <div>
                <dt>
                  <InfoTooltip termKey="support" compact />
                </dt>
                <dd>{data.levels.support}</dd>
              </div>
              <div>
                <dt>
                  <InfoTooltip termKey="resistance" compact />
                </dt>
                <dd>{data.levels.resistance}</dd>
              </div>
              <div>
                <dt>
                  <InfoTooltip termKey="putWall" compact />
                </dt>
                <dd>{data.levels.support}</dd>
              </div>
              <div>
                <dt>
                  <InfoTooltip termKey="callWall" compact />
                </dt>
                <dd>{data.levels.resistance}</dd>
              </div>
              <div>
                <dt>
                  <InfoTooltip termKey="maxPain" compact />
                </dt>
                <dd>{data.levels.maxPain}</dd>
              </div>
            </dl>
          </section>
        )}
        <section className="side-section zone-read">
          <h3>{language === "es" ? "Lectura de zonas" : "Zone read"}</h3>
          <strong>{zoneReading.summary}</strong>
          <ul>
            {zoneReading.attention.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <span>{zoneReading.riskNote}</span>
        </section>
        <TradeReadPanel tradeRead={data.tradeRead} dataSource={data.dataSource} language={language} />
      </aside>
    </div>
  );
}
