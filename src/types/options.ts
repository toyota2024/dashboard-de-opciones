export type Timeframe = {
  label: string;
  range: string;
  interval: string;
};

export type SelectedTimeframe = "5D_5M" | "30D_30M" | "3M_1D";
export type MarketTimeframeKey = SelectedTimeframe;

export type ActiveView = "projections" | "supportResistance";

export type MarketTimeframeMetadata = {
  key: SelectedTimeframe;
  alpacaTimeframe: "5Min" | "30Min" | "1Day";
  lookbackDays: number;
  limit: number;
  candlesReturned: number;
};

export type OptionType = "call" | "put";

export type FilterRejectReason =
  | "LOW_OPEN_INTEREST"
  | "LOW_VOLUME"
  | "WIDE_SPREAD"
  | "HIGH_THETA"
  | "DTE_OUT_OF_RANGE";

export type QuoteSnapshot = {
  agentName: string;
  ticker: string;
  price: number;
  changePercent: number;
  lastCandleDate: string;
  timeframes: Timeframe[];
  layers: string[];
};

export type HeaderSnapshot = {
  agentName: string;
  ticker: string;
  price: number;
  percentChange: number;
  lastCandleDate: string;
  formattedPrice: string;
  formattedChange: string;
  formattedLastCandleDate: string;
  timeframes: Timeframe[];
  layers: string[];
};

export type PricePoint = {
  date: string;
  timestamp?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  price?: number;
  projection?: number;
  expectedLow1?: number;
  expectedHigh1?: number;
  stressLow2?: number;
  stressHigh2?: number;
};

export type NormalizedPoint = {
  date: string;
  price: number;
  y: number;
};

export type ChartPoint = PricePoint & {
  phase: "history" | "projection";
};

export type OptionLevels = {
  spot: number;
  support: number;
  resistance: number;
  maxPain: number;
};

export type Scenario = {
  name: "Bullish" | "Neutral" | "Bearish";
  probability: number;
  targetArea: number;
};

export type ExpectedMove = {
  low1Sigma: number;
  base: number;
  high1Sigma: number;
  stressLow2Sigma: number;
  stressHigh2Sigma: number;
};

export type TradeRead = {
  primaryRegime: string;
  optionsLevel: string;
  bestStructure: string;
  riskNote: string;
  filteredContracts: string;
  weightedIV: string;
  avgDte: string;
};

export type OptionContract = {
  symbol: string;
  ticker: string;
  expiration: string;
  dte: number;
  strike: number;
  type: OptionType;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
};

export type RejectedOptionContract = {
  contract: OptionContract;
  reasons: FilterRejectReason[];
};

export type FilteredOptionResult = {
  accepted: OptionContract[];
  rejected: RejectedOptionContract[];
};

export type StrikeConcentration = {
  strike: number;
  callOpenInterest: number;
  putOpenInterest: number;
  totalOpenInterest: number;
  callVolume: number;
  putVolume: number;
  totalVolume: number;
};

export type OptionsDiagnostics = {
  totalContracts: number;
  acceptedContracts: number;
  rejectedContracts: number;
  rejectionSummary: Record<FilterRejectReason, number>;
  strikeConcentration: StrikeConcentration[];
  topCallWalls: StrikeConcentration[];
  topPutWalls: StrikeConcentration[];
};

export type OptionChainRow = {
  symbol: string;
  type: OptionType;
  expirationLabel: string;
  dte: number;
  strike: number;
  bid: string;
  ask: string;
  mid: string;
  volume: string;
  openInterest: string;
  impliedVolatility: string;
  delta: string;
  theta: string;
};

export type ModelConfig = {
  minOpenInterest: number;
  minVolume: number;
  maxBidAskSpreadPercent: number;
  maxThetaPercentOfPremium: number;
  preferredDteMin: number;
  preferredDteMax: number;
};

export type ModelControlState = ModelConfig & {
  ticker: string;
};

export type ScreenerStatus = "FAVORABLE" | "WATCH" | "RISKY" | "AVOID";

export type ScreenerGrade = "A" | "B" | "C" | "D";
export type SignalOutcome = "win" | "loss" | "breakeven";

export type AutoEvaluationRule = {
  targetMode: "projectionHead" | "resistance" | "fixedPercent";
  stopMode: "support" | "fixedPercent";
  targetPercent?: number;
  stopPercent?: number;
  maxBarsForward?: number;
  neutralMaxBreakPercent?: number;
};

export type AutoEvaluationResult = {
  signalId: string;
  ticker: string;
  evaluated: boolean;
  status: "open" | "closed";
  outcome?: SignalOutcome;
  exitPrice?: number;
  returnPercent?: number;
  closedAt?: string;
  barsChecked: number;
  reason: string;
};

export type ScreenerRow = {
  ticker: string;
  price: number;
  changePercent: number;
  projectionHead: number;
  callWall: number;
  putWall: number;
  maxPain: number;
  weightedIV: number;
  avgDte: number;
  expectedMove: number;
  bullishProbability: number;
  neutralProbability: number;
  bearishProbability: number;
  acceptedContracts: number;
  rejectedContracts: number;
  rejectionRate: number;
  primaryRegime: string;
  status: ScreenerStatus;
  screenerScore: number;
  screenerGrade: ScreenerGrade;
  scoreReasons: string[];
};

export type ScreenerSignalSnapshot = {
  id: string;
  createdAt: string;
  ticker: string;
  price: number;
  timeframe: MarketTimeframeKey;
  score: number;
  grade: ScreenerGrade;
  bias: string;
  bullishProbability: number;
  neutralProbability: number;
  bearishProbability: number;
  support: number;
  resistance: number;
  maxPain: number;
  projectionHead: number;
  iv: number;
  acceptedContracts: number;
  rejectedContracts: number;
  dataMode: "mock" | "hybrid" | "live";
  status: "open" | "closed" | "archived";
  notes?: string;
  exitPrice?: number;
  closedAt?: string;
  outcome?: SignalOutcome;
  returnPercent?: number;
  maxFavorableExcursion?: number;
  maxAdverseExcursion?: number;
};

export type PerformanceSummary = {
  totalSignals: number;
  openSignals: number;
  closedSignals: number;
  archivedSignals: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  averageReturnPercent: number;
  bestReturnPercent: number;
  worstReturnPercent: number;
  cumulativeReturnPercent: number;
  maxDrawdownPercent: number;
};

export type BackupPayload = {
  version: string;
  exportedAt: string;
  app: "options-projection-dashboard";
  signalHistory: ScreenerSignalSnapshot[];
  autoEvaluationRule: AutoEvaluationRule;
  performanceSummary?: PerformanceSummary;
};

export type ImportResult = {
  ok: boolean;
  importedSignals: number;
  skippedSignals: number;
  errors: string[];
};

export type SignalEvaluation = {
  signalId: string;
  ticker: string;
  entryPrice: number;
  currentPrice: number;
  unrealizedReturnPercent: number;
  suggestedOutcome: SignalOutcome | "open";
};

export type DataSourceStatus = {
  marketData: "real" | "mock";
  marketDataProvider: "alpaca" | "mock";
  optionsData: "real" | "mock";
  optionsDataProvider: "mock" | "alpaca" | "unknown";
  lastUpdated: string;
};

export type RawOptionProjectionInput = {
  quote: QuoteSnapshot;
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  optionChain: OptionContract[];
  selectedDteRange: [number, number];
  modelConfig: ModelConfig;
  dataSource?: DataSourceStatus;
  marketTimeframe?: MarketTimeframeMetadata;
};

export type ProjectionModel = {
  ticker: string;
  price: number;
  changePercent: number;
  header: HeaderSnapshot;
  levels: OptionLevels;
  projectionHead: number;
  projectionDescription: string;
  expectedMove: ExpectedMove;
  scenarios: Scenario[];
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  normalizedHistoricalPath: NormalizedPoint[];
  normalizedProjectedPath: NormalizedPoint[];
  chartData: ChartPoint[];
  chartDomain: [number, number];
  tradeRead: TradeRead;
  weightedIV: number;
  avgDte: number;
  expectedMoveAmount: number;
  diagnostics: OptionsDiagnostics;
  filteredContracts: OptionContract[];
  rejectedContracts: RejectedOptionContract[];
  optionChainRows: OptionChainRow[];
  dataSource: DataSourceStatus;
  marketTimeframe?: MarketTimeframeMetadata;
};
