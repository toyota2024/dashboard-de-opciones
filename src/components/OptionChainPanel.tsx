import { useMemo, useState } from "react";
import { InfoTooltip } from "./InfoTooltip";
import type { Language } from "../lib/i18n";
import type { OptionChainRow, OptionType } from "../types/options";

type ChainFilter = "all" | OptionType;

type OptionChainPanelProps = {
  rows: OptionChainRow[];
  language?: Language;
};

export function OptionChainPanel({ rows, language = "en" }: OptionChainPanelProps) {
  const [filter, setFilter] = useState<ChainFilter>("all");
  const visibleContracts = useMemo(
    () => rows.filter((contract) => filter === "all" || contract.type === filter).slice(0, 30),
    [rows, filter],
  );

  return (
    <section className="audit-panel audit-panel--wide">
      <div className="audit-panel-header">
        <div>
          <p className="terminal-label">{language === "es" ? "Contratos aceptados" : "Accepted contracts"}</p>
          <h3>{language === "es" ? "Option Chain filtrada" : "Filtered Option Chain"}</h3>
        </div>
        <div className="mini-tabs" aria-label="Filter option chain">
          {(["all", "call", "put"] as const).map((item) => (
            <button className={filter === item ? "is-active" : ""} key={item} onClick={() => setFilter(item)} type="button">
              {item === "all" ? (language === "es" ? "Todos" : "All") : item === "call" ? "Calls" : "Puts"}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <table className="audit-table">
          <thead>
            <tr>
              <th>{language === "es" ? "Tipo" : "Type"}</th>
              <th>Exp</th>
              <th><InfoTooltip termKey="dte" compact /></th>
              <th>Strike</th>
              <th><InfoTooltip termKey="bid" compact /></th>
              <th><InfoTooltip termKey="ask" compact /></th>
              <th><InfoTooltip termKey="mid" compact /></th>
              <th><InfoTooltip termKey="volume" compact /></th>
              <th><InfoTooltip termKey="openInterest" label="OI" compact /></th>
              <th><InfoTooltip termKey="iv" compact /></th>
              <th><InfoTooltip termKey="delta" compact /></th>
              <th><InfoTooltip termKey="theta" compact /></th>
            </tr>
          </thead>
          <tbody>
            {visibleContracts.map((contract) => (
              <tr key={contract.symbol}>
                <td>
                  <span className={`type-badge type-badge--${contract.type}`}>{contract.type.toUpperCase()}</span>
                </td>
                <td>{contract.expirationLabel}</td>
                <td>{contract.dte}</td>
                <td>{contract.strike}</td>
                <td>{contract.bid}</td>
                <td>{contract.ask}</td>
                <td>{contract.mid}</td>
                <td>{contract.volume}</td>
                <td>{contract.openInterest}</td>
                <td>{contract.impliedVolatility}</td>
                <td>{contract.delta}</td>
                <td>{contract.theta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
