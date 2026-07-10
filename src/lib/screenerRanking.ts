import type { ScreenerGrade, ScreenerRow } from "../types/options";

export type ScorableScreenerRow = Omit<ScreenerRow, "screenerScore" | "screenerGrade" | "scoreReasons">;

export type ScreenerScoreResult = {
  score: number;
  grade: ScreenerGrade;
  reasons: string[];
};

export function calculateScreenerScore(row: ScorableScreenerRow): ScreenerScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const bias = row.primaryRegime.toLowerCase();

  if (row.bullishProbability >= 50) {
    score += 25;
    reasons.push("Bullish probability >= 50%");
  } else if (row.bullishProbability >= 40) {
    score += 18;
    reasons.push("Bullish probability >= 40%");
  } else if (row.bullishProbability >= 30) {
    score += 10;
    reasons.push("Bullish probability >= 30%");
  }

  if (row.neutralProbability >= 55 && bias.includes("neutral")) {
    score += 10;
    reasons.push("Neutral probability supports neutral bias");
  }

  if (row.bearishProbability >= 40 && bias.includes("bearish")) {
    score += 15;
    reasons.push("Bearish probability supports bearish bias");
  }

  if (row.acceptedContracts >= 40) {
    score += 15;
    reasons.push("Accepted contracts >= 40");
  } else if (row.acceptedContracts >= 20) {
    score += 8;
    reasons.push("Accepted contracts >= 20");
  }

  if (row.rejectionRate <= 25) {
    score += 15;
    reasons.push("Low rejection rate <= 25%");
  } else if (row.rejectionRate <= 40) {
    score += 8;
    reasons.push("Rejection rate <= 40%");
  }

  if (row.weightedIV >= 0.25 && row.weightedIV <= 0.65) {
    score += 15;
    reasons.push("IV in reasonable range");
  } else if (row.weightedIV > 0.9) {
    score -= 15;
    reasons.push("IV above 90%");
  } else if (row.weightedIV < 0.15) {
    score -= 5;
    reasons.push("IV below 15%");
  }

  if (row.status === "FAVORABLE") {
    score += 15;
    reasons.push("Status favorable");
  } else if (row.status === "WATCH") {
    score += 5;
    reasons.push("Status watch");
  } else if (row.status === "RISKY") {
    score -= 10;
    reasons.push("Status risky");
  } else {
    score -= 20;
    reasons.push("Status avoid");
  }

  const finalScore = clampScore(score);

  return {
    score: finalScore,
    grade: getGrade(finalScore),
    reasons,
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getGrade(score: number): ScreenerGrade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "D";
}
