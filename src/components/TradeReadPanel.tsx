import { DataSourceBadges } from "./DataSourceBadges";
import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { DataSourceStatus } from "../types/options";
import type { TradeRead } from "../types/options";

type TradeReadPanelProps = {
  tradeRead: TradeRead;
  dataSource: DataSourceStatus;
  language?: Language;
};

export function TradeReadPanel({ tradeRead, dataSource, language = "en" }: TradeReadPanelProps) {
  return (
    <section className="side-section">
      <h3>{language === "es" ? "Capa de lectura" : "Trade Read Layer"}</h3>
      <DataSourceBadges dataSource={dataSource} compact language={language} />
      <dl className="metric-list metric-list--trade">
        <div>
          <dt>
            <InfoTooltip termKey="scenarioProbabilities" label={language === "es" ? "Regimen principal" : "Primary regime"} compact />
          </dt>
          <dd>{tradeRead.primaryRegime}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="callWall" label={language === "es" ? "Nivel de opciones" : "Options level"} compact />
          </dt>
          <dd>{tradeRead.optionsLevel}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Mejor estructura" : "Best structure"}</dt>
          <dd>{tradeRead.bestStructure}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Nota de riesgo" : "Risk note"}</dt>
          <dd>{tradeRead.riskNote}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="filteredContracts" compact />
          </dt>
          <dd>{tradeRead.filteredContracts}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="iv" label="Weighted IV" compact />
          </dt>
          <dd>{tradeRead.weightedIV}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="dte" label="Avg DTE" compact />
          </dt>
          <dd>{tradeRead.avgDte}</dd>
        </div>
      </dl>
    </section>
  );
}
