import { getGlossaryTerm } from "../lib/glossary";
import type { GlossaryKey } from "../lib/glossary";

type InfoTooltipProps = {
  termKey: GlossaryKey | string;
  label?: string;
  compact?: boolean;
};

export function InfoTooltip({ termKey, label, compact = false }: InfoTooltipProps) {
  const term = getGlossaryTerm(termKey);
  const displayLabel = label ?? term?.label ?? termKey;
  const tooltipText = term?.short ?? "Definicion no disponible todavia.";

  return (
    <span className={`info-tooltip ${compact ? "info-tooltip--compact" : ""}`}>
      <span>{displayLabel}</span>
      <button className="info-tooltip__trigger" type="button" aria-label={`${displayLabel}: ${tooltipText}`}>
        i
      </button>
      <span className="info-tooltip__bubble" role="tooltip">
        {tooltipText}
        {term && <em>Ver mas en el glosario.</em>}
      </span>
    </span>
  );
}
