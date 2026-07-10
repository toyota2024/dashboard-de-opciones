import type { OptionContract, Scenario } from "../types/options";

type ScenarioInput = {
  spot: number;
  callWall: number;
  putWall: number;
  maxPain: number;
  expectedMove: number;
  weightedIV: number;
  filteredChain: OptionContract[];
};

export function calculateScenarioProbabilities({
  spot,
  callWall,
  putWall,
  maxPain,
  expectedMove,
  weightedIV,
  filteredChain,
}: ScenarioInput): Pick<Scenario, "name" | "probability">[] {
  let bullish = 25;
  let neutral = 50;
  let bearish = 25;
  const expectedMovePercent = spot > 0 ? expectedMove / spot : 0;
  const maxPainDistance = spot > 0 ? Math.abs(spot - maxPain) / spot : 1;

  // Mock heuristic only. It is deterministic and can later be replaced by a real model fed by API data.
  if (spot >= putWall && spot <= callWall) {
    neutral += 12;
    bullish -= 4;
    bearish -= 4;
  }

  if (spot > callWall) {
    bullish += 16;
    neutral -= 8;
    bearish -= 8;
  }

  if (spot < putWall) {
    bearish += 16;
    neutral -= 8;
    bullish -= 8;
  }

  if (maxPainDistance < 0.05) {
    neutral += 8;
    bullish -= 4;
    bearish -= 4;
  }

  if (expectedMovePercent > 0.12 || weightedIV > 0.38) {
    bullish += 4;
    bearish += 4;
    neutral -= 8;
  }

  const callOi = sumOpenInterest(filteredChain, "call");
  const putOi = sumOpenInterest(filteredChain, "put");
  const totalOi = callOi + putOi;

  if (totalOi > 0) {
    const callSkew = (callOi - putOi) / totalOi;
    bullish += callSkew * 8;
    bearish -= callSkew * 8;
  }

  return normalizeProbabilities({ bullish, neutral, bearish });
}

function sumOpenInterest(filteredChain: OptionContract[], type: "call" | "put"): number {
  return filteredChain
    .filter((contract) => contract.type === type)
    .reduce((total, contract) => total + contract.openInterest, 0);
}

function normalizeProbabilities(scores: { bullish: number; neutral: number; bearish: number }) {
  const minimum = 12;
  const clamped = {
    bullish: Math.max(minimum, scores.bullish),
    neutral: Math.max(minimum, scores.neutral),
    bearish: Math.max(minimum, scores.bearish),
  };
  const total = clamped.bullish + clamped.neutral + clamped.bearish;
  const bullish = Math.round((clamped.bullish / total) * 100);
  const neutral = Math.round((clamped.neutral / total) * 100);
  const bearish = 100 - bullish - neutral;

  return [
    { name: "Bullish" as const, probability: bullish },
    { name: "Neutral" as const, probability: neutral },
    { name: "Bearish" as const, probability: bearish },
  ];
}
