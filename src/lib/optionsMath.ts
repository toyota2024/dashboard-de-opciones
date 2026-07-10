import type {
  FilterRejectReason,
  FilteredOptionResult,
  ModelConfig,
  OptionContract,
  OptionsDiagnostics,
  OptionType,
  StrikeConcentration,
} from "../types/options";

export function filterOptionChain(optionChain: OptionContract[], config: ModelConfig): OptionContract[] {
  return filterOptionChainWithDiagnostics(optionChain, config).accepted;
}

export function filterOptionChainWithDiagnostics(
  optionChain: OptionContract[],
  config: ModelConfig,
): FilteredOptionResult {
  return optionChain.reduce<FilteredOptionResult>(
    (result, contract) => {
      const reasons = getRejectReasons(contract, config);

      if (reasons.length === 0) {
        result.accepted.push(contract);
      } else {
        result.rejected.push({ contract, reasons });
      }

      return result;
    },
    { accepted: [], rejected: [] },
  );
}

export function calculateMidPrice(contract: OptionContract): number {
  return (contract.bid + contract.ask) / 2;
}

export function calculateBidAskSpreadPercent(contract: OptionContract): number {
  const mid = calculateMidPrice(contract);

  if (mid <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return (contract.ask - contract.bid) / mid;
}

export function calculateThetaPercentOfPremium(contract: OptionContract): number {
  const mid = calculateMidPrice(contract);

  if (mid <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(contract.theta) / mid;
}

export function groupOpenInterestByStrike(optionChain: OptionContract[], type: OptionType): Record<number, number> {
  return optionChain
    .filter((contract) => contract.type === type)
    .reduce<Record<number, number>>((accumulator, contract) => {
      accumulator[contract.strike] = (accumulator[contract.strike] ?? 0) + contract.openInterest;
      return accumulator;
    }, {});
}

export function buildStrikeConcentration(optionChain: OptionContract[]): StrikeConcentration[] {
  const byStrike = optionChain.reduce<Record<number, StrikeConcentration>>((accumulator, contract) => {
    const current = accumulator[contract.strike] ?? {
      strike: contract.strike,
      callOpenInterest: 0,
      putOpenInterest: 0,
      totalOpenInterest: 0,
      callVolume: 0,
      putVolume: 0,
      totalVolume: 0,
    };

    if (contract.type === "call") {
      current.callOpenInterest += contract.openInterest;
      current.callVolume += contract.volume;
    } else {
      current.putOpenInterest += contract.openInterest;
      current.putVolume += contract.volume;
    }

    current.totalOpenInterest += contract.openInterest;
    current.totalVolume += contract.volume;
    accumulator[contract.strike] = current;

    return accumulator;
  }, {});

  return Object.values(byStrike).sort((left, right) => left.strike - right.strike);
}

export function buildOptionsDiagnostics(
  optionChain: OptionContract[],
  filteredResult: FilteredOptionResult,
): OptionsDiagnostics {
  const rejectionSummary = createEmptyRejectionSummary();
  const strikeConcentration = buildStrikeConcentration(filteredResult.accepted);

  filteredResult.rejected.forEach((rejected) => {
    rejected.reasons.forEach((reason) => {
      rejectionSummary[reason] += 1;
    });
  });

  return {
    totalContracts: optionChain.length,
    acceptedContracts: filteredResult.accepted.length,
    rejectedContracts: filteredResult.rejected.length,
    rejectionSummary,
    strikeConcentration,
    topCallWalls: [...strikeConcentration]
      .sort((left, right) => right.callOpenInterest - left.callOpenInterest)
      .slice(0, 5),
    topPutWalls: [...strikeConcentration]
      .sort((left, right) => right.putOpenInterest - left.putOpenInterest)
      .slice(0, 5),
  };
}

export function detectCallWall(optionChain: OptionContract[]): number {
  return detectWall(optionChain, "call");
}

export function detectPutWall(optionChain: OptionContract[]): number {
  return detectWall(optionChain, "put");
}

export function calculateMaxPain(optionChain: OptionContract[]): number {
  const candidateStrikes = Array.from(new Set(optionChain.map((contract) => contract.strike))).sort((a, b) => a - b);

  if (candidateStrikes.length === 0) {
    return 0;
  }

  const payouts = candidateStrikes.map((settlementStrike) => ({
    strike: settlementStrike,
    payout: optionChain.reduce((total, contract) => {
      const intrinsic =
        contract.type === "call"
          ? Math.max(0, settlementStrike - contract.strike)
          : Math.max(0, contract.strike - settlementStrike);

      return total + intrinsic * contract.openInterest;
    }, 0),
  }));

  return payouts.reduce((leader, item) => (item.payout < leader.payout ? item : leader)).strike;
}

export function calculateExpectedMoveFromChain(optionChain: OptionContract[], spot: number): number {
  const weightedIV = calculateWeightedIV(optionChain);
  const avgDte = calculateAverageDte(optionChain);

  return spot * weightedIV * Math.sqrt(avgDte / 365);
}

export function calculateWeightedIV(optionChain: OptionContract[]): number {
  const totalOpenInterest = optionChain.reduce((total, contract) => total + contract.openInterest, 0);

  if (totalOpenInterest === 0) {
    return 0;
  }

  return (
    optionChain.reduce((total, contract) => total + contract.impliedVolatility * contract.openInterest, 0) /
    totalOpenInterest
  );
}

export function calculateAverageDte(optionChain: OptionContract[]): number {
  const totalOpenInterest = optionChain.reduce((total, contract) => total + contract.openInterest, 0);

  if (totalOpenInterest === 0) {
    return 0;
  }

  return optionChain.reduce((total, contract) => total + contract.dte * contract.openInterest, 0) / totalOpenInterest;
}

export function calculateOneSigmaRange(base: number, expectedMove: number): [number, number] {
  return [base - expectedMove, base + expectedMove];
}

export function calculateTwoSigmaRange(base: number, expectedMove: number): [number, number] {
  return [base - expectedMove * 2, base + expectedMove * 2];
}

function detectWall(optionChain: OptionContract[], type: OptionType): number {
  const openInterestByStrike = groupOpenInterestByStrike(optionChain, type);
  const entries = Object.entries(openInterestByStrike);

  if (entries.length === 0) {
    return 0;
  }

  return Number(entries.sort(([, leftOi], [, rightOi]) => rightOi - leftOi)[0][0]);
}

function getRejectReasons(contract: OptionContract, config: ModelConfig): FilterRejectReason[] {
  const reasons: FilterRejectReason[] = [];

  if (contract.openInterest < config.minOpenInterest) {
    reasons.push("LOW_OPEN_INTEREST");
  }

  if (contract.volume < config.minVolume) {
    reasons.push("LOW_VOLUME");
  }

  if (calculateBidAskSpreadPercent(contract) > config.maxBidAskSpreadPercent) {
    reasons.push("WIDE_SPREAD");
  }

  if (calculateThetaPercentOfPremium(contract) > config.maxThetaPercentOfPremium) {
    reasons.push("HIGH_THETA");
  }

  if (contract.dte < config.preferredDteMin || contract.dte > config.preferredDteMax) {
    reasons.push("DTE_OUT_OF_RANGE");
  }

  return reasons;
}

function createEmptyRejectionSummary(): Record<FilterRejectReason, number> {
  return {
    LOW_OPEN_INTEREST: 0,
    LOW_VOLUME: 0,
    WIDE_SPREAD: 0,
    HIGH_THETA: 0,
    DTE_OUT_OF_RANGE: 0,
  };
}
