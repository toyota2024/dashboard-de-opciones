import type { OptionContract } from "../types.js";

export type OptionsDataQualityStatus = "usable" | "partial" | "unusable";

export type OptionsDataQualityRecommendation =
  | "use_real_options"
  | "use_mock_options"
  | "use_real_contracts_but_mock_greeks";

export type OptionsDataQualityReport = {
  status: OptionsDataQualityStatus;
  score: number;
  totalContracts: number;
  contractsWithBidAsk: number;
  contractsWithVolume: number;
  contractsWithOpenInterest: number;
  contractsWithIV: number;
  contractsWithGreeks: number;
  bidAskCoverage: number;
  volumeCoverage: number;
  openInterestCoverage: number;
  ivCoverage: number;
  greeksCoverage: number;
  coverage: {
    bidAsk: number;
    volume: number;
    openInterest: number;
    iv: number;
    greeks: number;
  };
  blockingReasons: string[];
  warnings: string[];
  recommendation: OptionsDataQualityRecommendation;
};

export function evaluateOptionsDataQuality(optionChain: OptionContract[]): OptionsDataQualityReport {
  const totalContracts = optionChain.length;
  const contractsWithBidAsk = optionChain.filter((contract) => contract.bid > 0 && contract.ask > 0).length;
  const contractsWithVolume = optionChain.filter((contract) => contract.volume > 0).length;
  const contractsWithOpenInterest = optionChain.filter((contract) => contract.openInterest > 0).length;
  const contractsWithIV = optionChain.filter((contract) => contract.impliedVolatility > 0).length;
  const contractsWithGreeks = optionChain.filter(hasNonZeroGreeks).length;
  const bidAskCoverage = coverage(contractsWithBidAsk, totalContracts);
  const volumeCoverage = coverage(contractsWithVolume, totalContracts);
  const openInterestCoverage = coverage(contractsWithOpenInterest, totalContracts);
  const ivCoverage = coverage(contractsWithIV, totalContracts);
  const greeksCoverage = coverage(contractsWithGreeks, totalContracts);
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  if (totalContracts < 50) {
    blockingReasons.push("Not enough contracts");
  }
  if (bidAskCoverage < 0.3) {
    blockingReasons.push("Bid/ask coverage below minimum threshold");
  }
  if (ivCoverage < 0.3) {
    blockingReasons.push("IV coverage below minimum threshold");
  }
  if (openInterestCoverage < 0.5) {
    warnings.push("Open interest coverage is incomplete");
  }
  if (greeksCoverage < 0.5) {
    warnings.push("Greeks coverage is incomplete");
  }
  if (volumeCoverage < 0.5) {
    warnings.push("Volume coverage is incomplete");
  }

  const score = Math.round(
    (bidAskCoverage * 0.3 + volumeCoverage * 0.15 + openInterestCoverage * 0.2 + ivCoverage * 0.25 + greeksCoverage * 0.1) *
      100,
  );
  const usable =
    totalContracts >= 100 &&
    bidAskCoverage >= 0.7 &&
    volumeCoverage >= 0.5 &&
    openInterestCoverage >= 0.5 &&
    ivCoverage >= 0.6;
  const partial = totalContracts >= 50 && bidAskCoverage >= 0.3 && ivCoverage >= 0.3;
  const status: OptionsDataQualityStatus = usable ? "usable" : partial ? "partial" : "unusable";
  const recommendation: OptionsDataQualityRecommendation =
    status === "usable"
      ? "use_real_options"
      : status === "partial"
        ? "use_real_contracts_but_mock_greeks"
        : "use_mock_options";

  if (status === "unusable" && blockingReasons.length === 0) {
    blockingReasons.push("Options data does not meet minimum quality thresholds");
  }
  if (status === "partial") {
    warnings.push("Real contracts detected, but critical fields are incomplete");
  }

  return {
    status,
    score,
    totalContracts,
    contractsWithBidAsk,
    contractsWithVolume,
    contractsWithOpenInterest,
    contractsWithIV,
    contractsWithGreeks,
    bidAskCoverage,
    volumeCoverage,
    openInterestCoverage,
    ivCoverage,
    greeksCoverage,
    coverage: {
      bidAsk: bidAskCoverage,
      volume: volumeCoverage,
      openInterest: openInterestCoverage,
      iv: ivCoverage,
      greeks: greeksCoverage,
    },
    blockingReasons,
    warnings,
    recommendation,
  };
}

function coverage(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

function hasNonZeroGreeks(contract: OptionContract): boolean {
  return contract.delta !== 0 && contract.gamma !== 0 && contract.theta !== 0 && contract.vega !== 0;
}
