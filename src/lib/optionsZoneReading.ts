import type { Language } from "./i18n";
import type { OptionLevels } from "../types/options";

export type OptionsZoneState =
  | "near_floor"
  | "near_ceiling"
  | "middle_range"
  | "near_max_pain"
  | "above_ceiling"
  | "below_floor"
  | "unknown";

export type ProjectionBias = "up" | "down" | "sideways" | "unknown";

export type OptionsZoneReading = {
  zoneState: OptionsZoneState;
  projectionBias: ProjectionBias;
  summary: string;
  attention: string[];
  riskNote: string;
};

type ZoneReadingInput = {
  spot: number;
  levels: OptionLevels;
  projectionHead: number;
  language: Language;
};

export function buildOptionsZoneReading({
  spot,
  levels,
  projectionHead,
  language,
}: ZoneReadingInput): OptionsZoneReading {
  const zoneState = getZoneState(spot, levels);
  const projectionBias = getProjectionBias(spot, projectionHead);
  const copy = getZoneCopy(zoneState, projectionBias, language);

  return {
    zoneState,
    projectionBias,
    summary: copy.summary,
    attention: copy.attention,
    riskNote: copy.riskNote,
  };
}

function getZoneState(spot: number, levels: OptionLevels): OptionsZoneState {
  if (!spot || !levels.support || !levels.resistance || !levels.maxPain) return "unknown";
  if (spot > levels.resistance) return "above_ceiling";
  if (spot < levels.support) return "below_floor";
  if (isWithinPercent(spot, levels.maxPain, 1)) return "near_max_pain";
  if (isWithinPercent(spot, levels.support, 1.5)) return "near_floor";
  if (isWithinPercent(spot, levels.resistance, 1.5)) return "near_ceiling";
  return "middle_range";
}

function getProjectionBias(spot: number, projectionHead: number): ProjectionBias {
  if (!spot || !projectionHead) return "unknown";
  const changePercent = ((projectionHead - spot) / spot) * 100;
  if (changePercent > 1) return "up";
  if (changePercent < -1) return "down";
  return "sideways";
}

function isWithinPercent(value: number, target: number, percent: number): boolean {
  if (!target) return false;
  return Math.abs((value - target) / target) * 100 <= percent;
}

function getZoneCopy(zoneState: OptionsZoneState, projectionBias: ProjectionBias, language: Language) {
  const es = language === "es";
  const biasText = getBiasText(projectionBias, language);

  const map: Record<OptionsZoneState, { summary: string; attention: string[]; riskNote: string }> = {
    near_floor: {
      summary: es ? "Precio cerca del piso / Put Wall." : "Price near floor / Put Wall.",
      attention: [es ? "Vigilar confirmacion de la zona." : "Watch for zone confirmation.", biasText],
      riskNote: es ? "Lectura de zonas, no senal automatica." : "Zone read, not an automated signal.",
    },
    near_ceiling: {
      summary: es ? "Precio cerca del techo / Call Wall." : "Price near ceiling / Call Wall.",
      attention: [es ? "Observar si aparece ruptura sostenida." : "Watch whether a sustained breakout appears.", biasText],
      riskNote: es ? "Lectura de zonas, no recomendacion de estrategia." : "Zone read, not a strategy recommendation.",
    },
    middle_range: {
      summary: es ? "Precio en zona media entre piso y techo." : "Price in the middle zone between floor and ceiling.",
      attention: [es ? "Ventaja visual menor; observar extremos o ruptura." : "Lower visual edge; watch extremes or breakout.", biasText],
      riskNote: es ? "Mapa visual basado en opciones simuladas." : "Visual map based on simulated options levels.",
    },
    near_max_pain: {
      summary: es ? "Precio cerca de Max Pain." : "Price near Max Pain.",
      attention: [es ? "Posible zona de equilibrio del modelo." : "Possible model equilibrium area.", biasText],
      riskNote: es ? "Max Pain sigue simulado." : "Max Pain remains simulated.",
    },
    above_ceiling: {
      summary: es ? "Precio sobre el techo / Call Wall." : "Price above ceiling / Call Wall.",
      attention: [es ? "Vigilar si la ruptura se sostiene." : "Watch whether the breakout holds.", biasText],
      riskNote: es ? "No implica senal de compra." : "Does not imply a buy signal.",
    },
    below_floor: {
      summary: es ? "Precio bajo el piso / Put Wall." : "Price below floor / Put Wall.",
      attention: [es ? "Riesgo de ruptura bajista en el mapa." : "Bearish breakdown risk in the map.", biasText],
      riskNote: es ? "No implica senal de venta." : "Does not imply a sell signal.",
    },
    unknown: {
      summary: es ? "Zona sin lectura suficiente." : "Zone read unavailable.",
      attention: [biasText],
      riskNote: es ? "Faltan niveles para una lectura completa." : "Levels are missing for a complete read.",
    },
  };

  return map[zoneState];
}

function getBiasText(projectionBias: ProjectionBias, language: Language): string {
  const es = language === "es";

  if (projectionBias === "up") return es ? "Proyeccion base apunta hacia arriba." : "Base projection points up.";
  if (projectionBias === "down") return es ? "Proyeccion base apunta hacia abajo." : "Base projection points down.";
  if (projectionBias === "sideways") return es ? "Proyeccion base lateral." : "Base projection is sideways.";
  return es ? "Sesgo de proyeccion no disponible." : "Projection bias unavailable.";
}
