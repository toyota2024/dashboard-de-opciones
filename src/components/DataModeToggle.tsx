import { t, type Language } from "../lib/i18n";
import type { ProviderName } from "../providers/providerRegistry";

type DataModeToggleProps = {
  mode: ProviderName;
  language: Language;
  onChange: (mode: ProviderName) => void;
};

export function DataModeToggle({ mode, language, onChange }: DataModeToggleProps) {
  const activeLabel = mode === "backend" ? t("realAlpaca", language) : t("simulation", language);

  return (
    <div className={`mode-toggle-card mode-toggle-card--${mode}`} aria-label={t("dataMode", language)}>
      <span>{t("activeMode", language)}: <strong>{activeLabel}</strong></span>
      <div className="segmented-control mode-toggle-buttons">
        <button aria-pressed={mode === "mock"} className={mode === "mock" ? "active" : ""} onClick={() => onChange("mock")} type="button">
          {t("simulation", language)}
          {mode === "mock" && <em>{t("active", language)}</em>}
        </button>
        <button aria-pressed={mode === "backend"} className={mode === "backend" ? "active" : ""} onClick={() => onChange("backend")} type="button">
          {t("realAlpaca", language)}
          {mode === "backend" && <em>{t("active", language)}</em>}
        </button>
      </div>
      <strong className="mode-simple-summary">{mode === "backend" ? t("backendSimpleSummary", language) : t("mockSimpleSummary", language)}</strong>
      <p>{mode === "backend" ? t("realAlpacaDescription", language) : t("simulationDescription", language)}</p>
    </div>
  );
}
