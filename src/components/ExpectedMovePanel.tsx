import { InfoTooltip } from "./InfoTooltip";
import type { ExpectedMove } from "../types/options";

type ExpectedMovePanelProps = {
  expectedMove: ExpectedMove;
};

export function ExpectedMovePanel({ expectedMove }: ExpectedMovePanelProps) {
  return (
    <section className="side-section">
      <h3>
        <InfoTooltip termKey="expectedMove" label="Expected Move Cone" />
      </h3>
      <dl className="metric-list">
        <div>
          <dt>
            <InfoTooltip termKey="oneSigma" label="1σ low" compact />
          </dt>
          <dd>{expectedMove.low1Sigma}</dd>
        </div>
        <div>
          <dt>Base</dt>
          <dd>{expectedMove.base}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="oneSigma" label="1σ high" compact />
          </dt>
          <dd>{expectedMove.high1Sigma}</dd>
        </div>
        <div>
          <dt>
            <InfoTooltip termKey="twoSigma" label="2σ stress range" compact />
          </dt>
          <dd>
            {expectedMove.stressLow2Sigma} - {expectedMove.stressHigh2Sigma}
          </dd>
        </div>
      </dl>
    </section>
  );
}
