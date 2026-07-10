import { getDataSourceCopy } from "../lib/dataSourceCopy";
import { t, type Language } from "../lib/i18n";
import type { DataSourceStatus } from "../types/options";

type DataSourceBadgesProps = {
  dataSource: DataSourceStatus;
  compact?: boolean;
  language?: Language;
};

export function DataSourceBadges({ dataSource, compact = false, language = "en" }: DataSourceBadgesProps) {
  const copy = getDataSourceCopy(dataSource, language);

  return (
    <div className={`data-source ${compact ? "data-source--compact" : ""}`}>
      <div className="data-source-badges" aria-label="Data source status">
        <span className={`source-badge source-badge--${dataSource.marketData}`}>
          {t("market", language)}: {sourceLabel(dataSource.marketData, language)} / {providerLabel(dataSource.marketDataProvider)}
        </span>
        <span className={`source-badge source-badge--${dataSource.optionsData}`}>
          {t("options", language)}: {formatOptionsLabel(dataSource, language)}
        </span>
        <span className="source-badge source-badge--time">{t("lastUpdated", language)}: {formatUpdated(dataSource.lastUpdated)}</span>
      </div>
      {!compact && <strong>{copy.modeTitle}</strong>}
      {!compact && <p className="data-source-summary">{dataSource.marketData === "real" ? t("backendDataSummary", language) : t("mockDataSummary", language)}</p>}
      {!compact && <p className="data-source-secondary">{copy.warningText}</p>}
      {!compact && copy.optionsQualityNote && <p className="data-source-note">{copy.optionsQualityNote}</p>}
    </div>
  );
}

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sourceLabel(value: "real" | "mock", language: Language): string {
  return value === "real" ? t("real", language) : t("mock", language);
}

function providerLabel(value: string): string {
  return value === "alpaca" ? "Alpaca" : label(value);
}

function formatOptionsLabel(dataSource: DataSourceStatus, language: Language): string {
  if (dataSource.optionsData === "real") {
    return `${sourceLabel(dataSource.optionsData, language)} / ${providerLabel(dataSource.optionsDataProvider)}`;
  }

  return sourceLabel(dataSource.optionsData, language);
}

function formatUpdated(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
