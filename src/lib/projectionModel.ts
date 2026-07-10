import { getPriceRange, normalizePath } from "./chartScale";
import { formatDateLabel, formatPercent, formatPrice } from "./formatters";
import {
  calculateAverageDte,
  calculateExpectedMoveFromChain,
  calculateMaxPain,
  calculateOneSigmaRange,
  calculateTwoSigmaRange,
  calculateWeightedIV,
  buildOptionsDiagnostics,
  calculateMidPrice,
  detectCallWall,
  detectPutWall,
  filterOptionChainWithDiagnostics,
} from "./optionsMath";
import { calculateScenarioProbabilities } from "./scenarioModel";
import type {
  ChartPoint,
  ExpectedMove,
  OptionChainRow,
  OptionContract,
  PricePoint,
  ProjectionModel,
  RawOptionProjectionInput,
} from "../types/options";

export function buildProjectionModel(rawData: RawOptionProjectionInput): ProjectionModel {
  const spot = rawData.quote.price;
  const filterConfig = {
    ...rawData.modelConfig,
    preferredDteMin: Math.max(rawData.modelConfig.preferredDteMin, rawData.selectedDteRange[0]),
    preferredDteMax: Math.min(rawData.modelConfig.preferredDteMax, rawData.selectedDteRange[1]),
  };
  const filteredResult = filterOptionChainWithDiagnostics(rawData.optionChain, filterConfig);
  const diagnostics = buildOptionsDiagnostics(rawData.optionChain, filteredResult);
  const chainForModel = filteredResult.accepted.length > 0 ? filteredResult.accepted : rawData.optionChain;
  const callWall = detectCallWall(chainForModel);
  const putWall = detectPutWall(chainForModel);
  const maxPain = calculateMaxPain(chainForModel);
  const weightedIV = calculateWeightedIV(chainForModel);
  const avgDte = calculateAverageDte(chainForModel);
  const expectedMoveAmount = calculateExpectedMoveFromChain(chainForModel, spot);
  const [oneSigmaLow, oneSigmaHigh] = calculateOneSigmaRange(spot, expectedMoveAmount);
  const [twoSigmaLow, twoSigmaHigh] = calculateTwoSigmaRange(spot, expectedMoveAmount);
  const projectionHead = Math.round(spot * 0.4 + maxPain * 0.25 + ((oneSigmaLow + oneSigmaHigh) / 2) * 0.35);
  const levels = {
    spot,
    support: putWall,
    resistance: callWall,
    maxPain,
  };
  const expectedMove: ExpectedMove = {
    low1Sigma: Math.round(oneSigmaLow),
    base: projectionHead,
    high1Sigma: Math.round(oneSigmaHigh),
    stressLow2Sigma: Math.round(twoSigmaLow),
    stressHigh2Sigma: Math.round(twoSigmaHigh),
  };
  const scenarios = calculateScenarioProbabilities({
    spot,
    callWall,
    putWall,
    maxPain,
    expectedMove: expectedMoveAmount,
    weightedIV,
    filteredChain: chainForModel,
  }).map((scenario) => ({
    ...scenario,
    targetArea:
      scenario.name === "Bullish"
        ? expectedMove.high1Sigma
        : scenario.name === "Bearish"
          ? expectedMove.low1Sigma
          : projectionHead,
  }));
  const projectedPath = buildProjectedPath(rawData.projectedPath, spot, projectionHead, expectedMove);
  const chartDomain = getPriceRange(levels, expectedMove);
  const chartData = buildChartData(rawData.historicalPath, projectedPath);

  return {
    ticker: rawData.quote.ticker,
    price: spot,
    changePercent: rawData.quote.changePercent,
    header: {
      agentName: rawData.quote.agentName,
      ticker: rawData.quote.ticker,
      price: spot,
      percentChange: rawData.quote.changePercent,
      lastCandleDate: rawData.quote.lastCandleDate,
      formattedPrice: formatPrice(spot),
      formattedChange: formatPercent(rawData.quote.changePercent),
      formattedLastCandleDate: formatDateLabel(rawData.quote.lastCandleDate),
      timeframes: rawData.quote.timeframes,
      layers: rawData.quote.layers,
    },
    levels,
    projectionHead,
    projectionDescription: "6mo base path from options pressure",
    expectedMove,
    scenarios,
    historicalPath: rawData.historicalPath,
    projectedPath,
    normalizedHistoricalPath: normalizePath(rawData.historicalPath, chartDomain[0], chartDomain[1]),
    normalizedProjectedPath: normalizePath(projectedPath, chartDomain[0], chartDomain[1]),
    chartData,
    chartDomain,
    tradeRead: {
      primaryRegime: getPrimaryRegime(spot, putWall, callWall),
      optionsLevel: `S ${formatPrice(putWall)} / R ${formatPrice(callWall)}`,
      bestStructure: "Wait / defined risk",
      riskNote: spot > callWall * 0.97 ? "No chase near resistance" : "Mock read only",
      filteredContracts: `${filteredResult.accepted.length} / ${rawData.optionChain.length}`,
      weightedIV: formatPercent(weightedIV * 100, false),
      avgDte: `${Math.round(avgDte)} days`,
    },
    weightedIV,
    avgDte,
    expectedMoveAmount,
    diagnostics,
    filteredContracts: filteredResult.accepted,
    rejectedContracts: filteredResult.rejected,
    optionChainRows: buildOptionChainRows(filteredResult.accepted),
    dataSource: rawData.dataSource ?? {
      marketData: "mock",
      marketDataProvider: "mock",
      optionsData: "mock",
      optionsDataProvider: "mock",
      lastUpdated: new Date().toISOString(),
    },
    marketTimeframe: rawData.marketTimeframe,
  };
}

function buildOptionChainRows(contracts: OptionContract[]): OptionChainRow[] {
  return contracts.map((contract) => ({
    symbol: contract.symbol,
    type: contract.type,
    expirationLabel: contract.expiration.slice(5),
    dte: contract.dte,
    strike: contract.strike,
    bid: contract.bid.toFixed(2),
    ask: contract.ask.toFixed(2),
    mid: calculateMidPrice(contract).toFixed(2),
    volume: contract.volume.toLocaleString("en-US"),
    openInterest: contract.openInterest.toLocaleString("en-US"),
    impliedVolatility: `${(contract.impliedVolatility * 100).toFixed(1)}%`,
    delta: contract.delta.toFixed(3),
    theta: contract.theta.toFixed(3),
  }));
}

function buildProjectedPath(
  rawProjectedPath: PricePoint[],
  spot: number,
  projectionHead: number,
  expectedMove: ExpectedMove,
): PricePoint[] {
  const steps = Math.max(rawProjectedPath.length, 1);

  return rawProjectedPath.map((point, index) => {
    const progress = (index + 1) / steps;

    return {
      date: point.date,
      projection: Math.round(spot + (projectionHead - spot) * progress),
      expectedLow1: Math.round(spot + (expectedMove.low1Sigma - spot) * progress),
      expectedHigh1: Math.round(spot + (expectedMove.high1Sigma - spot) * progress),
      stressLow2: Math.round(spot + (expectedMove.stressLow2Sigma - spot) * progress),
      stressHigh2: Math.round(spot + (expectedMove.stressHigh2Sigma - spot) * progress),
    };
  });
}

function buildChartData(historicalPath: PricePoint[], projectedPath: PricePoint[]): ChartPoint[] {
  const lastHistory = historicalPath[historicalPath.length - 1];
  const projectionAnchor: ChartPoint[] = lastHistory
    ? [
        {
          date: lastHistory.date,
          projection: lastHistory.price ?? lastHistory.close,
          expectedLow1: lastHistory.price ?? lastHistory.close,
          expectedHigh1: lastHistory.price ?? lastHistory.close,
          stressLow2: lastHistory.price ?? lastHistory.close,
          stressHigh2: lastHistory.price ?? lastHistory.close,
          phase: "projection",
        },
      ]
    : [];

  return [
    ...historicalPath.map((point) => ({ ...point, phase: "history" as const })),
    ...projectionAnchor,
    ...projectedPath.map((point) => ({ ...point, phase: "projection" as const })),
  ];
}

function getPrimaryRegime(spot: number, putWall: number, callWall: number): string {
  if (spot > callWall) {
    return "Bullish Breakout Pressure";
  }

  if (spot < putWall) {
    return "Bearish Breakdown Pressure";
  }

  return "Neutral / Mean Reversion";
}
