import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { OptionLevels, StrikeConcentration } from "../types/options";

type StrikeConcentrationPanelProps = {
  concentrations: StrikeConcentration[];
  levels: OptionLevels;
  language?: Language;
};

export function StrikeConcentrationPanel({ concentrations, levels, language = "en" }: StrikeConcentrationPanelProps) {
  const topStrikes = [...concentrations]
    .sort((left, right) => right.totalOpenInterest - left.totalOpenInterest)
    .slice(0, 12);

  return (
    <section className="audit-panel audit-panel--wide">
      <p className="terminal-label">
        <InfoTooltip termKey="openInterest" label={language === "es" ? "Interes abierto por strike" : "Open interest by strike"} compact />
      </p>
      <h3>{language === "es" ? "Concentracion por strike" : "Strike Concentration"}</h3>

      <div className="table-scroll">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Strike</th>
              <th><InfoTooltip termKey="openInterest" label="Call OI" compact /></th>
              <th><InfoTooltip termKey="openInterest" label="Put OI" compact /></th>
              <th><InfoTooltip termKey="openInterest" label="Total OI" compact /></th>
              <th><InfoTooltip termKey="volume" label="Call Vol" compact /></th>
              <th><InfoTooltip termKey="volume" label="Put Vol" compact /></th>
              <th>{language === "es" ? "Senal" : "Signal"}</th>
            </tr>
          </thead>
          <tbody>
            {topStrikes.map((item) => (
              <tr className={getRowClass(item.strike, levels)} key={item.strike}>
                <td>{item.strike}</td>
                <td>{item.callOpenInterest.toLocaleString("en-US")}</td>
                <td>{item.putOpenInterest.toLocaleString("en-US")}</td>
                <td>{item.totalOpenInterest.toLocaleString("en-US")}</td>
                <td>{item.callVolume.toLocaleString("en-US")}</td>
                <td>{item.putVolume.toLocaleString("en-US")}</td>
                <td>{getSignalLabel(item.strike, levels)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getRowClass(strike: number, levels: OptionLevels): string {
  if (strike === levels.resistance) return "is-call-wall";
  if (strike === levels.support) return "is-put-wall";
  if (strike === levels.maxPain) return "is-max-pain";
  return "";
}

function getSignalLabel(strike: number, levels: OptionLevels) {
  const labels = [];

  if (strike === levels.resistance) labels.push(<InfoTooltip key="callWall" termKey="callWall" compact />);
  if (strike === levels.support) labels.push(<InfoTooltip key="putWall" termKey="putWall" compact />);
  if (strike === levels.maxPain) labels.push(<InfoTooltip key="maxPain" termKey="maxPain" compact />);

  if (labels.length === 0) return "-";

  return <span className="signal-tooltip-list">{labels}</span>;
}
