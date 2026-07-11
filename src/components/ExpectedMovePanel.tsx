import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { ExpectedMove } from "../types/options";

type ExpectedMovePanelProps = {
  expectedMove: ExpectedMove;
  language?: Language;
};

export function ExpectedMovePanel({ expectedMove, language = "en" }: ExpectedMovePanelProps) {
  return (
    <section className="side-section">
      <h3>
        <InfoTooltip termKey="expectedMove" label={language === "es" ? "Cono de movimiento esperado" : "Expected Move Cone"} />
      </h3>
      <dl className="metric-list">
        <div>
          <dt>
            <InfoTooltip termKey="oneSigma" label={language === "es" ? "1σ bajo" : "1σ low"} compact />
          </dt>
          <dd>{expectedMove.low1Sigma}</dd>
        </div>
        <div>
          <dt>{language === "es" ? "Base" : "Base"}</dt>
          <dd>{expectedMove.base}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="oneSigma" label={language === "es" ? "1σ alto" : "1σ high"} compact />
          </dt>
          <dd>{expectedMove.high1Sigma}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="twoSigma" label={language === "es" ? "Rango de estres 2σ" : "2σ stress range"} compact />
          </dt>
          <dd>
            {expectedMove.stressLow2Sigma} - {expectedMove.stressHigh2Sigma}
          </dd>
        </div>
      </dl>
    </section>
  );
}
