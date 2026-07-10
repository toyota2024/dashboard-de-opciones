import { buildProjectionModel } from "./projectionModel";
import { calculateScreenerScore } from "./screenerRanking";
import type { ModelConfig, RawOptionProjectionInput, ScreenerRow, ScreenerStatus, Scenario } from "../types/options";

export function buildScreenerRows(rawUniverse: RawOptionProjectionInput[], modelConfig: ModelConfig): ScreenerRow[] {
  return rawUniverse.map((rawData) => {
    const model = buildProjectionModel({
      ...rawData,
      selectedDteRange: [modelConfig.preferredDteMin, modelConfig.preferredDteMax],
      modelConfig,
    });
    const bullishProbability = getScenarioProbability(model.scenarios, "Bullish");
    const neutralProbability = getScenarioProbability(model.scenarios, "Neutral");
    const bearishProbability = getScenarioProbability(model.scenarios, "Bearish");
    const rejectionRate =
      model.diagnostics.totalContracts === 0
        ? 100
        : (model.diagnostics.rejectedContracts / model.diagnostics.totalContracts) * 100;

    const rowWithoutScore = {
      ticker: model.ticker,
      price: model.price,
      changePercent: model.changePercent,
      projectionHead: model.projectionHead,
      callWall: model.levels.resistance,
      putWall: model.levels.support,
      maxPain: model.levels.maxPain,
      weightedIV: model.weightedIV,
      avgDte: model.avgDte,
      expectedMove: model.expectedMoveAmount,
      bullishProbability,
      neutralProbability,
      bearishProbability,
      acceptedContracts: model.diagnostics.acceptedContracts,
      rejectedContracts: model.diagnostics.rejectedContracts,
      rejectionRate,
      primaryRegime: model.tradeRead.primaryRegime,
      status: calculateStatus({
        acceptedContracts: model.diagnostics.acceptedContracts,
        rejectionRate,
        weightedIV: model.weightedIV,
        expectedMovePercent: model.price > 0 ? model.expectedMoveAmount / model.price : 1,
        bullishProbability,
        neutralProbability,
      }),
    };
    const score = calculateScreenerScore(rowWithoutScore);

    return {
      ...rowWithoutScore,
      screenerScore: score.score,
      screenerGrade: score.grade,
      scoreReasons: score.reasons,
    };
  });
}

function calculateStatus({
  acceptedContracts,
  rejectionRate,
  weightedIV,
  expectedMovePercent,
  bullishProbability,
  neutralProbability,
}: {
  acceptedContracts: number;
  rejectionRate: number;
  weightedIV: number;
  expectedMovePercent: number;
  bullishProbability: number;
  neutralProbability: number;
}): ScreenerStatus {
  if (acceptedContracts < 8 || rejectionRate > 82) return "AVOID";
  if (weightedIV > 0.62 || rejectionRate > 62 || expectedMovePercent > 0.22) return "RISKY";
  if (acceptedContracts > 20 && rejectionRate < 50 && Math.max(bullishProbability, neutralProbability) >= 40 && weightedIV < 0.52) {
    return "FAVORABLE";
  }

  return "WATCH";
}

function getScenarioProbability(scenarios: Scenario[], name: Scenario["name"]): number {
  return scenarios.find((scenario) => scenario.name === name)?.probability ?? 0;
}
