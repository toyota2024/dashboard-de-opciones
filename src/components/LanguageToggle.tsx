import { t, type Language } from "../lib/i18n";

type LanguageToggleProps = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="mode-toggle-card" aria-label={t("language", language)}>
      <span>{t("language", language)}</span>
      <div className="segmented-control mode-toggle-buttons">
        <button className={language === "es" ? "active" : ""} onClick={() => onChange("es")} type="button">
          {t("spanish", language)}
        </button>
        <button className={language === "en" ? "active" : ""} onClick={() => onChange("en")} type="button">
          {t("english", language)}
        </button>
      </div>
    </div>
  );
}
