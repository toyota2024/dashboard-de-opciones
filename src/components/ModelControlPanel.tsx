import type { ReactNode } from "react";
import type { ModelControlState } from "../types/options";
import { t, type Language } from "../lib/i18n";
import type { ProviderName } from "../providers/providerRegistry";
import { SymbolSearchInput } from "./SymbolSearchInput";

export const modelPresets = {
  Conservative: {
    minOpenInterest: 1000,
    minVolume: 250,
    maxBidAskSpreadPercent: 0.08,
    maxThetaPercentOfPremium: 0.2,
    preferredDteMin: 21,
    preferredDteMax: 45,
  },
  Balanced: {
    minOpenInterest: 500,
    minVolume: 100,
    maxBidAskSpreadPercent: 0.12,
    maxThetaPercentOfPremium: 0.3,
    preferredDteMin: 14,
    preferredDteMax: 45,
  },
  Aggressive: {
    minOpenInterest: 150,
    minVolume: 25,
    maxBidAskSpreadPercent: 0.2,
    maxThetaPercentOfPremium: 0.45,
    preferredDteMin: 7,
    preferredDteMax: 60,
  },
} satisfies Record<string, Omit<ModelControlState, "ticker">>;

type ModelControlPanelProps = {
  state: ModelControlState;
  error: string;
  providerName: string;
  providerMode: ProviderName;
  language: Language;
  onChange: (state: ModelControlState) => void;
  onRunAnalysis: () => void;
  onResetDefaults: () => void;
  onApplyPreset: (preset: Omit<ModelControlState, "ticker">) => void;
  onSelectTicker: (ticker: string) => void;
  onClearSelectedTicker?: () => void;
};

export function ModelControlPanel({
  state,
  error,
  providerName,
  providerMode,
  language,
  onChange,
  onRunAnalysis,
  onResetDefaults,
  onApplyPreset,
  onSelectTicker,
  onClearSelectedTicker,
}: ModelControlPanelProps) {
  return (
    <section className="model-control" aria-label="Model controls">
      <div className="model-control-header">
        <div>
          <p className="terminal-label">{t("modelControl", language)}</p>
          <h2>{t("analysisFilters", language)}</h2>
        </div>
        <div className="preset-row" aria-label="Model presets">
          {Object.entries(modelPresets).map(([name, preset]) => (
            <button key={name} onClick={() => onApplyPreset(preset)} type="button">
              {name === "Conservative" ? t("conservative", language) : name === "Balanced" ? t("balanced", language) : t("aggressive", language)}
            </button>
          ))}
        </div>
      </div>

      <div className="control-form">
        <Field label={t("ticker", language)}>
          <SymbolSearchInput
            value={state.ticker}
            providerName={providerMode}
            language={language}
            onChange={(value) => onChange({ ...state, ticker: value })}
            onSelectSymbol={(symbol) => {
              onChange({ ...state, ticker: symbol });
              onSelectTicker(symbol);
            }}
          />
        </Field>
        <NumberField
          label={t("minOpenInterest", language)}
          value={state.minOpenInterest}
          onChange={(value) => onChange({ ...state, minOpenInterest: value })}
        />
        <NumberField
          label={t("minVolume", language)}
          value={state.minVolume}
          onChange={(value) => onChange({ ...state, minVolume: value })}
        />
        <NumberField
          label={t("maxBidAskSpread", language)}
          value={state.maxBidAskSpreadPercent * 100}
          onChange={(value) =>
            // UI uses whole percents; the model stores decimal rates, so 10 becomes 0.10.
            onChange({ ...state, maxBidAskSpreadPercent: value / 100 })
          }
        />
        <NumberField
          label={t("maxThetaPremium", language)}
          value={state.maxThetaPercentOfPremium * 100}
          onChange={(value) =>
            // UI uses whole percents; the model stores decimal rates, so 30 becomes 0.30.
            onChange({ ...state, maxThetaPercentOfPremium: value / 100 })
          }
        />
        <NumberField
          label={t("preferredDteMin", language)}
          value={state.preferredDteMin}
          onChange={(value) => onChange({ ...state, preferredDteMin: value })}
        />
        <NumberField
          label={t("preferredDteMax", language)}
          value={state.preferredDteMax}
          onChange={(value) => onChange({ ...state, preferredDteMax: value })}
        />
      </div>

      <div className="model-actions">
        <button className="primary-action" onClick={onRunAnalysis} type="button">
          {t("runAnalysis", language)}
        </button>
        <button className="secondary-action" onClick={onResetDefaults} type="button">
          {t("resetDefaults", language)}
        </button>
        {onClearSelectedTicker && (
          <button className="secondary-action" onClick={onClearSelectedTicker} type="button">
            {t("clearSelectedTicker", language)}
          </button>
        )}
        {error && <p className="control-error">{error}</p>}
      </div>

      <div className="current-filters">
        <span>{t("currentFilters", language)}</span>
        <strong>
          OI &gt;= {state.minOpenInterest} · Volume &gt;= {state.minVolume} · Spread &lt;={" "}
          {(state.maxBidAskSpreadPercent * 100).toFixed(0)}% · Theta &lt;={" "}
          {(state.maxThetaPercentOfPremium * 100).toFixed(0)}% · DTE {state.preferredDteMin}-{state.preferredDteMax}
        </strong>
        <em>{t("dataProvider", language)}: {providerName}</em>
      </div>

      <p className={`provider-context provider-context--${providerName.toLowerCase()}`}>
        {providerName.toLowerCase() === "backend"
          ? t("providerBackendActive", language)
          : t("providerMockActive", language)}
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="control-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} type="number" />
    </Field>
  );
}
