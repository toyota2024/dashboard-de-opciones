import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { symbolDirectory, type SymbolDirectoryItem } from "../data/symbolDirectory";
import { t, type Language } from "../lib/i18n";
import type { ProviderName } from "../providers/providerRegistry";

type SymbolSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectSymbol: (symbol: string) => void;
  providerName: ProviderName;
  language: Language;
  disabled?: boolean;
};

const demoTickers = new Set(["MU", "AMD", "NVDA", "TSLA", "AAPL", "HOOD"]);
const tickerPattern = /^[A-Z0-9.-]{1,10}$/;

export function SymbolSearchInput({
  value,
  onChange,
  onSelectSymbol,
  providerName,
  language,
  disabled = false,
}: SymbolSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(
    () => findSuggestions(value, providerName),
    [providerName, value],
  );
  const normalizedTicker = value.trim().toUpperCase();
  const canSubmitTicker = tickerPattern.test(normalizedTicker) && (providerName === "backend" || demoTickers.has(normalizedTicker));

  function selectSymbol(symbol: string) {
    onChange(symbol);
    onSelectSymbol(symbol);
    setIsOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && suggestions[activeIndex]) {
        selectSymbol(suggestions[activeIndex].symbol);
        return;
      }
      if (canSubmitTicker) {
        selectSymbol(normalizedTicker);
      }
    }
  }

  return (
    <div className="symbol-search">
      <input
        disabled={disabled}
        placeholder={t("searchTickerOrCompany", language)}
        type="text"
        value={value}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      <small>{t("examplesTickerSearch", language)}</small>

      {isOpen && value.trim().length > 0 && (
        <div className="symbol-search-menu" role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                className={index === activeIndex ? "is-active" : ""}
                key={item.symbol}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSymbol(item.symbol);
                }}
                type="button"
              >
                <strong>{item.symbol}</strong>
                <span>{item.name}</span>
                <em>{item.type === "etf" ? t("etf", language) : t("stock", language)}</em>
              </button>
            ))
          ) : (
            <p>{providerName === "backend" ? t("noLocalMatchTryAlpaca", language) : t("simulationOnlyDemoTickers", language)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function findSuggestions(query: string, providerName: ProviderName): SymbolDirectoryItem[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return [];

  const upperQuery = trimmedQuery.toUpperCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const source = providerName === "mock" ? symbolDirectory.filter((item) => demoTickers.has(item.symbol)) : symbolDirectory;

  return source
    .filter((item) =>
      item.symbol.startsWith(upperQuery) ||
      item.symbol.includes(upperQuery) ||
      item.name.toLowerCase().includes(lowerQuery),
    )
    .sort((left, right) => scoreSymbol(left, upperQuery, lowerQuery) - scoreSymbol(right, upperQuery, lowerQuery))
    .slice(0, 8);
}

function scoreSymbol(item: SymbolDirectoryItem, upperQuery: string, lowerQuery: string): number {
  if (item.symbol === upperQuery) return 0;
  if (item.symbol.startsWith(upperQuery)) return 1;
  if (item.name.toLowerCase().startsWith(lowerQuery)) return 2;
  if (item.name.toLowerCase().includes(lowerQuery)) return 3;
  return 4;
}
