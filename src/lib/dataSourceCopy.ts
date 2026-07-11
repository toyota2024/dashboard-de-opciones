import type { DataSourceStatus } from "../types/options";
import { t, type Language } from "./i18n";

export type DataSourceCopy = {
  modeTitle: string;
  warningText: string;
  chartTitle: string;
  chartBadge: string;
  screenerTitle: string;
  screenerBadge: string;
  footerText: string;
  auditTitle: string;
  optionsQualityNote?: string;
};

export function getDataSourceCopy(dataSource: DataSourceStatus, language: Language = "en"): DataSourceCopy {
  if (dataSource.marketData === "real" && dataSource.optionsData === "real") {
    return {
      modeTitle: "Live Options Mode: Real Market Data + Real Options Data",
      warningText: "Market candles and options data are real. Outputs are analytical only, not financial advice.",
      chartTitle: language === "es" ? "Mapa visual de opciones" : "Options Visual Map",
      chartBadge: language === "es" ? "Mercado + opciones reales" : "Live market + options data",
      screenerTitle: "MULTI-TICKER LIVE OPTIONS SCAN",
      screenerBadge: "Real options data",
      footerText:
        language === "es"
          ? "Datos de mercado y opciones provistos por Alpaca. Salida analitica solamente. No es asesoria financiera."
          : "Market and options data provided by Alpaca. Analytical output only. No financial advice.",
      auditTitle: language === "es" ? "Auditoria del motor de opciones" : "Live Options Engine Audit",
    };
  }

  if (dataSource.marketData === "real" && dataSource.optionsData === "mock") {
    return {
      modeTitle: t("hybridMode", language),
      warningText: t("hybridWarning", language),
      chartTitle: language === "es" ? "Mapa visual de opciones" : "Options Visual Map",
      chartBadge: language === "es" ? "Velas reales / Opciones simuladas" : "Real candles / Mock options",
      screenerTitle: "MULTI-TICKER HYBRID SCAN",
      screenerBadge: "Real market / Mock options",
      footerText:
        language === "es"
          ? "Datos de mercado provistos por Alpaca. Los niveles de opciones son simulados. No hay ejecucion de trading ni asesoria financiera."
          : "Market data provided by Alpaca. Options levels are simulated. No trading logic or financial advice.",
      auditTitle: language === "es" ? "Auditoria del motor de opciones" : "Options Engine Audit",
      optionsQualityNote: t("optionsIncomplete", language),
    };
  }

  return {
    modeTitle: t("simulationMode", language),
    warningText: t("mockWarning", language),
    chartTitle: language === "es" ? "Mapa visual de opciones" : "Options Visual Map",
    chartBadge: language === "es" ? "Solo datos mock" : "Mock data only",
    screenerTitle: "MULTI-TICKER MOCK SCAN",
    screenerBadge: "Mock universe",
    footerText:
      language === "es"
        ? "Dashboard simulado solo para pruebas de interfaz. No hay datos de mercado reales, logica de trading ni asesoria financiera."
        : "Simulated dashboard for interface prototyping only. No live market data, trading logic, or financial advice.",
    auditTitle: language === "es" ? "Auditoria del motor de opciones" : "Options Engine Audit",
  };
}
