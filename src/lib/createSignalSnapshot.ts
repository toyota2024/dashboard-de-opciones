import type { DataSourceStatus, ScreenerRow, ScreenerSignalSnapshot, SelectedTimeframe } from "../types/options";

type CreateSignalSnapshotInput = {
  row: ScreenerRow;
  timeframe: SelectedTimeframe;
  dataSource: DataSourceStatus;
  notes?: string;
};

export function createSignalSnapshotFromScreenerRow({
  row,
  timeframe,
  dataSource,
  notes,
}: CreateSignalSnapshotInput): ScreenerSignalSnapshot {
  const createdAt = new Date().toISOString();

  return {
    id: `${row.ticker}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    ticker: row.ticker,
    price: row.price,
    timeframe,
    score: row.screenerScore,
    grade: row.screenerGrade,
    bias: row.primaryRegime,
    bullishProbability: row.bullishProbability,
    neutralProbability: row.neutralProbability,
    bearishProbability: row.bearishProbability,
    support: row.putWall,
    resistance: row.callWall,
    maxPain: row.maxPain,
    projectionHead: row.projectionHead,
    iv: row.weightedIV,
    acceptedContracts: row.acceptedContracts,
    rejectedContracts: row.rejectedContracts,
    dataMode: getDataMode(dataSource),
    status: "open",
    notes,
  };
}

function getDataMode(dataSource: DataSourceStatus): ScreenerSignalSnapshot["dataMode"] {
  if (dataSource.marketData === "real" && dataSource.optionsData === "real") return "live";
  if (dataSource.marketData === "real" && dataSource.optionsData === "mock") return "hybrid";
  return "mock";
}
