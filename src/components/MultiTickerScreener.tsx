import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { InfoTooltip } from "./InfoTooltip";
import { t, type Language } from "../lib/i18n";
import type { ScreenerRow, ScreenerStatus } from "../types/options";
import type { ProviderName } from "../providers/providerRegistry";

type MultiTickerScreenerProps = {
  rows: ScreenerRow[];
  selectedTicker: string;
  providerName: ProviderName;
  language: Language;
  skippedTickers: Array<{ ticker: string; error: string }>;
  isLoading: boolean;
  onOpen: (ticker: string) => void;
  onTrackSignal: (row: ScreenerRow) => void;
};

type SortKey =
  | "score"
  | "bullishProbability"
  | "neutralProbability"
  | "bearishProbability"
  | "weightedIV"
  | "acceptedContracts"
  | "rejectionRate"
  | "price"
  | "ticker";
type SortDirection = "desc" | "asc";
type BiasFilter = "all" | "bullish" | "neutral" | "bearish";
type ScoreFilter = "all" | "50" | "65" | "80";
type AcceptedFilter = "all" | "10" | "20" | "40";
type RejectionFilter = "all" | "25" | "40" | "60";

const statusFilters: Array<"all" | ScreenerStatus> = ["all", "FAVORABLE", "WATCH", "RISKY", "AVOID"];

export function MultiTickerScreener({
  rows,
  selectedTicker,
  providerName,
  language,
  skippedTickers,
  isLoading,
  onOpen,
  onTrackSignal,
}: MultiTickerScreenerProps) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | ScreenerStatus>("all");
  const [biasFilter, setBiasFilter] = useState<BiasFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [acceptedFilter, setAcceptedFilter] = useState<AcceptedFilter>("all");
  const [rejectionFilter, setRejectionFilter] = useState<RejectionFilter>("all");
  const [searchTicker, setSearchTicker] = useState("");
  const [trackedTicker, setTrackedTicker] = useState("");
  const screenerTitle = providerName === "backend" ? "MULTI-TICKER HYBRID SCAN" : "MULTI-TICKER MOCK SCAN";
  const screenerBadge = providerName === "backend" ? "Alpaca market / Mock options" : "Mock demo universe";
  const normalizedSearchTicker = searchTicker.trim().toUpperCase();
  const searchedRows = useMemo(
    () => rows.filter((row) => normalizedSearchTicker === "" || row.ticker.includes(normalizedSearchTicker)),
    [normalizedSearchTicker, rows],
  );
  const visibleRows = useMemo(() => {
    const filteredRows = searchedRows.filter((row) =>
      matchesFilters(row, {
        statusFilter,
        biasFilter,
        scoreFilter,
        acceptedFilter,
        rejectionFilter,
      }),
    );

    return [...filteredRows].sort((left, right) => compareRows(left, right, sortKey, sortDirection));
  }, [acceptedFilter, biasFilter, rejectionFilter, scoreFilter, searchedRows, sortDirection, sortKey, statusFilter]);

  function trackSignal(row: ScreenerRow) {
    onTrackSignal(row);
    setTrackedTicker(row.ticker);
    window.setTimeout(() => setTrackedTicker(""), 1800);
  }

  return (
    <section className="screener-section" aria-label={screenerTitle}>
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{screenerTitle}</p>
          <h2>{t("optionsScreener", language)}</h2>
        </div>
        <span className="data-pill">{screenerBadge}</span>
      </div>

      {providerName === "backend" && (
        <p className="screener-note">{t("scannerLimited", language)}</p>
      )}
      <p className="screener-note">{t("screenerDataNote", language)}</p>
      <p className="screener-score-note">{t("screenerScoreNote", language)}</p>
      {trackedTicker && <div className="status-panel">Signal tracked for {trackedTicker}</div>}

      <div className="screener-controls" aria-label="Screener sorting and filters">
        <label>
          <span>{t("searchTicker", language)}</span>
          <input value={searchTicker} onChange={(event) => setSearchTicker(event.target.value.toUpperCase())} placeholder="Ticker" />
        </label>
        <Select label={t("sortBy", language)} value={sortKey} onChange={(value) => setSortKey(value as SortKey)}>
          <option value="score">Score</option>
          <option value="bullishProbability">Bull %</option>
          <option value="neutralProbability">Neutral %</option>
          <option value="bearishProbability">{language === "es" ? "Bajista %" : "Bear %"}</option>
          <option value="weightedIV">IV</option>
          <option value="acceptedContracts">Accepted contracts</option>
          <option value="rejectionRate">Rejection rate</option>
          <option value="price">Price</option>
          <option value="ticker">Ticker</option>
        </Select>
        <Select label={t("direction", language)} value={sortDirection} onChange={(value) => setSortDirection(value as SortDirection)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>
        <Select label={t("status", language)} value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | ScreenerStatus)}>
          {statusFilters.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? t("all", language) : status}
            </option>
          ))}
        </Select>
        <Select label={t("bias", language)} value={biasFilter} onChange={(value) => setBiasFilter(value as BiasFilter)}>
          <option value="all">{t("all", language)}</option>
          <option value="bullish">{language === "es" ? "Alcista" : "Bullish"}</option>
          <option value="neutral">Neutral</option>
          <option value="bearish">{language === "es" ? "Bajista" : "Bearish"}</option>
        </Select>
        <Select label={t("minimumScore", language)} value={scoreFilter} onChange={(value) => setScoreFilter(value as ScoreFilter)}>
          <option value="all">{t("all", language)}</option>
          <option value="50">50+</option>
          <option value="65">65+</option>
          <option value="80">80+</option>
        </Select>
        <Select label={t("minAccepted", language)} value={acceptedFilter} onChange={(value) => setAcceptedFilter(value as AcceptedFilter)}>
          <option value="all">{t("all", language)}</option>
          <option value="10">10+</option>
          <option value="20">20+</option>
          <option value="40">40+</option>
        </Select>
        <Select label={t("maxRejection", language)} value={rejectionFilter} onChange={(value) => setRejectionFilter(value as RejectionFilter)}>
          <option value="all">{t("all", language)}</option>
          <option value="25">25%</option>
          <option value="40">40%</option>
          <option value="60">60%</option>
        </Select>
      </div>

      <div className="screener-count">{t("showingTickers", language, { visible: visibleRows.length, total: rows.length })}</div>

      {isLoading && <div className="status-panel">Loading watchlist screener...</div>}

      {skippedTickers.length > 0 && (
        <div className="skipped-tickers">
          <strong>Skipped tickers</strong>
          {skippedTickers.map((item) => (
            <span key={item.ticker}>
              {item.ticker}: {item.error}
            </span>
          ))}
        </div>
      )}

      {visibleRows.length === 0 ? (
        <div className="status-panel">{t("noTickerMatches", language)}</div>
      ) : (
        <div className="table-scroll">
          <table className="audit-table screener-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th><InfoTooltip termKey="screenerScore" label={t("score", language)} compact /></th>
                <th><InfoTooltip termKey="screenerGrade" label={t("grade", language)} compact /></th>
                <th>{t("price", language)}</th>
                <th>{t("bias", language)}</th>
                <th>{language === "es" ? "Alcista %" : "Bull %"}</th>
                <th>Neutral %</th>
                <th>{language === "es" ? "Bajista %" : "Bear %"}</th>
                <th>Call Wall</th>
                <th>Put Wall</th>
                <th>Max Pain</th>
                <th><InfoTooltip termKey="iv" label="IV" compact /></th>
                <th>{language === "es" ? "DTE prom." : "Avg DTE"}</th>
                <th><InfoTooltip termKey="filteredContracts" label={language === "es" ? "Aceptados" : "Accepted"} compact /></th>
                <th>{language === "es" ? "Rechazados" : "Rejected"}</th>
                <th><InfoTooltip termKey="rejectionRate" label="Rej %" compact /></th>
                <th>{t("status", language)}</th>
                <th>{language === "es" ? "Accion" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr className={row.ticker === selectedTicker ? "is-selected-row" : ""} key={row.ticker}>
                  <td>
                    <strong>{row.ticker}</strong>
                  </td>
                  <td>
                    <span className={`score-pill score-pill--${row.screenerGrade.toLowerCase()}`}>{row.screenerScore}</span>
                  </td>
                  <td>
                    <span className={`grade-pill grade-pill--${row.screenerGrade.toLowerCase()}`} title={row.scoreReasons.join("; ")}>
                      {row.screenerGrade}
                    </span>
                  </td>
                  <td>{formatPrice(row.price)}</td>
                  <td>{row.primaryRegime}</td>
                  <td>{row.bullishProbability}%</td>
                  <td>{row.neutralProbability}%</td>
                  <td>{row.bearishProbability}%</td>
                  <td>{formatStrike(row.callWall)}</td>
                  <td>{formatStrike(row.putWall)}</td>
                  <td>{formatStrike(row.maxPain)}</td>
                  <td>{(row.weightedIV * 100).toFixed(1)}%</td>
                  <td>{Math.round(row.avgDte)}</td>
                  <td>{row.acceptedContracts}</td>
                  <td>{row.rejectedContracts}</td>
                  <td>{row.rejectionRate.toFixed(1)}%</td>
                  <td>
                    <span className={`status-pill status-pill--${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="screener-row-actions">
                      <button className="open-row-button" onClick={() => onOpen(row.ticker)} type="button">
                        {t("openAction", language)}
                      </button>
                      <button className="track-row-button" onClick={() => trackSignal(row)} type="button">
                        {t("trackSignal", language)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function matchesFilters(
  row: ScreenerRow,
  filters: {
    statusFilter: "all" | ScreenerStatus;
    biasFilter: BiasFilter;
    scoreFilter: ScoreFilter;
    acceptedFilter: AcceptedFilter;
    rejectionFilter: RejectionFilter;
  },
): boolean {
  const bias = row.primaryRegime.toLowerCase();
  const minimumScore = filters.scoreFilter === "all" ? 0 : Number(filters.scoreFilter);
  const minimumAccepted = filters.acceptedFilter === "all" ? 0 : Number(filters.acceptedFilter);
  const maxRejection = filters.rejectionFilter === "all" ? Number.POSITIVE_INFINITY : Number(filters.rejectionFilter);

  return (
    (filters.statusFilter === "all" || row.status === filters.statusFilter) &&
    (filters.biasFilter === "all" || bias.includes(filters.biasFilter)) &&
    row.screenerScore >= minimumScore &&
    row.acceptedContracts >= minimumAccepted &&
    row.rejectionRate <= maxRejection
  );
}

function compareRows(left: ScreenerRow, right: ScreenerRow, sortKey: SortKey, direction: SortDirection): number {
  const multiplier = direction === "asc" ? 1 : -1;
  const leftValue = getSortValue(left, sortKey);
  const rightValue = getSortValue(right, sortKey);

  if (typeof leftValue === "string" && typeof rightValue === "string") {
    return leftValue.localeCompare(rightValue) * multiplier;
  }

  return ((leftValue as number) - (rightValue as number)) * multiplier;
}

function getSortValue(row: ScreenerRow, sortKey: SortKey): string | number {
  if (sortKey === "score") return row.screenerScore;
  return row[sortKey];
}

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatStrike(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
