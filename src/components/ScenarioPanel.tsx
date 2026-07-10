import { InfoTooltip } from "./InfoTooltip";
import type { Scenario } from "../types/options";

type ScenarioPanelProps = {
  scenarios: Scenario[];
};

export function ScenarioPanel({ scenarios }: ScenarioPanelProps) {
  return (
    <section className="side-section">
      <h3>
        <InfoTooltip termKey="scenarioProbabilities" />
      </h3>
      <div className="scenario-list">
        {scenarios.map((scenario) => (
          <article className={`scenario-row scenario-row--${scenario.name.toLowerCase()}`} key={scenario.name}>
            <div>
              <strong>
                <InfoTooltip termKey={scenario.name.toLowerCase()} label={scenario.name} compact />
              </strong>
              <span>Target area {scenario.targetArea}</span>
            </div>
            <div className="probability-meter" aria-label={`${scenario.name} probability ${scenario.probability}%`}>
              <span style={{ width: `${scenario.probability}%` }} />
            </div>
            <b>{scenario.probability}%</b>
          </article>
        ))}
      </div>
    </section>
  );
}
