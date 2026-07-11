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
      <div className="trade-read-compact">
        <DataSourceBadges dataSource={dataSource} compact language={language} />

        <div className="trade-read-row">
          <span>
            <InfoTooltip termKey="scenarioProbabilities" label={language === "es" ? "Regimen" : "Regime"} compact />
          </span>
          <strong>{tradeRead.primaryRegime}</strong>
        </div>

        <div className="trade-read-row">
          <span>
            <InfoTooltip termKey="callWall" label={language === "es" ? "Niveles S/R" : "S/R Levels"} compact />
          </span>
          <strong>{tradeRead.optionsLevel}</strong>
        </div>

        <div className="trade-read-row">
          <span>{language === "es" ? "Lectura" : "Read"}</span>
          <strong>{tradeRead.bestStructure}</strong>
        </div>

        <div className="trade-read-mini-grid" aria-label={language === "es" ? "Metricas de lectura" : "Read metrics"}>
          <div>
            <span>
              <InfoTooltip termKey="iv" label={language === "es" ? "IV" : "IV"} compact />
            </span>
            <strong>{tradeRead.weightedIV}</strong>
          </div>
          <div>
            <span>
              <InfoTooltip termKey="dte" label="DTE" compact />
            </span>
            <strong>{tradeRead.avgDte}</strong>
          </div>
          <div>
            <span>
              <InfoTooltip termKey="filteredContracts" label={language === "es" ? "Contratos" : "Contracts"} compact />
            </span>
            <strong>{tradeRead.filteredContracts}</strong>
          </div>
        </div>

        <p className="trade-read-risk">
          <span>{language === "es" ? "Nota de riesgo" : "Risk note"}:</span> {tradeRead.riskNote}
        </p>
      </div>
    </section>
  );
}
