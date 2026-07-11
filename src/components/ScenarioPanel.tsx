import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { Scenario } from "../types/options";

type ScenarioPanelProps = {
  scenarios: Scenario[];
  language?: Language;
};

export function ScenarioPanel({ scenarios, language = "en" }: ScenarioPanelProps) {
  return (
    <section className="side-section">
      <h3>
        <InfoTooltip termKey="scenarioProbabilities" label={language === "es" ? "Probabilidades de escenarios" : undefined} />
      </h3>
      <div className="scenario-list">
        {scenarios.map((scenario) => (
          <article className={`scenario-row scenario-row--${scenario.name.toLowerCase()}`} key={scenario.name}>
            <div>
              <strong>
                <InfoTooltip termKey={scenario.name.toLowerCase()} label={formatScenarioName(scenario.name, language)} compact />
              </strong>
              <span>{language === "es" ? "Zona objetivo" : "Target area"} {scenario.targetArea}</span>
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

function formatScenarioName(name: Scenario["name"], language: Language): string {
  if (language !== "es") return name;

  if (name === "Bullish") return "Alcista";
  if (name === "Bearish") return "Bajista";

  return "Neutral";
}
