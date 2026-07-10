import { useMemo, useState } from "react";
import { t, type Language } from "../lib/i18n";

type WatchlistManagerProps = {
  activeTickers: string[];
  providerName: string;
  language: Language;
  isLoading: boolean;
  onApply: (tickers: string[]) => void;
  onReset: () => void;
};

type ParsedWatchlist = {
  validTickers: string[];
  invalidTickers: string[];
  duplicateTickers: string[];
  trimmedCount: number;
};

const maxTickers = 25;
const tickerPattern = /^[A-Z0-9.-]{1,10}$/;

export function WatchlistManager({
  activeTickers,
  providerName,
  language,
  isLoading,
  onApply,
  onReset,
}: WatchlistManagerProps) {
  const [input, setInput] = useState(activeTickers.join(", "));
  const parsed = useMemo(() => parseWatchlist(input), [input]);

  function applyWatchlist() {
    onApply(parsed.validTickers);
  }

  function resetWatchlist() {
    const defaults = getDefaultText(providerName);
    setInput(defaults);
    onReset();
  }

  return (
    <section className="watchlist-manager" aria-label="Watchlist universe">
      <div className="audit-title-row">
        <div>
          <p className="terminal-label">{t("watchlistUniverse", language)}</p>
          <h2>{t("customScreenerUniverse", language)}</h2>
        </div>
        <span className="data-pill">{activeTickers.length} {t("activeTickers", language)}</span>
      </div>

      <p className="watchlist-note">
        {providerName === "backend"
          ? t("backendWatchlistNote", language)
          : t("mockWatchlistNote", language)}
      </p>
      <p className="watchlist-note">{t("watchlistTickerOnlyNote", language)}</p>

      <textarea
        className="watchlist-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={3}
        placeholder="MSFT, META, GOOGL, AMZN, JPM, COST, XOM, SPY, QQQ"
      />

      <div className="watchlist-actions">
        <button className="primary-action" disabled={parsed.validTickers.length === 0 || isLoading} onClick={applyWatchlist} type="button">
          {isLoading ? "Loading..." : t("applyWatchlist", language)}
        </button>
        <button className="secondary-action" disabled={isLoading} onClick={resetWatchlist} type="button">
          {t("resetDefault", language)}
        </button>
        <span>{parsed.validTickers.length} {t("validMax", language)} {maxTickers}</span>
      </div>

      {(parsed.invalidTickers.length > 0 || parsed.duplicateTickers.length > 0 || parsed.trimmedCount > 0) && (
        <div className="watchlist-validation">
          {parsed.invalidTickers.length > 0 && <p>Ignored invalid: {parsed.invalidTickers.join(", ")}</p>}
          {parsed.duplicateTickers.length > 0 && <p>Removed duplicates: {parsed.duplicateTickers.join(", ")}</p>}
          {parsed.trimmedCount > 0 && <p>Ignored {parsed.trimmedCount} tickers above the {maxTickers} ticker limit.</p>}
        </div>
      )}

      <div className="watchlist-chip-row" aria-label="Active watchlist tickers">
        {activeTickers.map((ticker) => (
          <span key={ticker}>{ticker}</span>
        ))}
      </div>
    </section>
  );
}

function parseWatchlist(value: string): ParsedWatchlist {
  const rawTickers = value
    .split(/[\s,]+/)
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);
  const validTickers: string[] = [];
  const invalidTickers: string[] = [];
  const duplicateTickers: string[] = [];
  const seen = new Set<string>();

  for (const ticker of rawTickers) {
    if (!tickerPattern.test(ticker)) {
      invalidTickers.push(ticker);
      continue;
    }

    if (seen.has(ticker)) {
      duplicateTickers.push(ticker);
      continue;
    }

    seen.add(ticker);

    if (validTickers.length < maxTickers) {
      validTickers.push(ticker);
    }
  }

  const validUniqueCount = Array.from(seen).length;

  return {
    validTickers,
    invalidTickers,
    duplicateTickers,
    trimmedCount: Math.max(validUniqueCount - maxTickers, 0),
  };
}

function getDefaultText(providerName: string): string {
  return providerName === "backend"
    ? "AMD, NVDA, AAPL, MSFT, META, TSLA, SPY, QQQ"
    : "MU, AMD, NVDA, TSLA, AAPL, HOOD";
}
