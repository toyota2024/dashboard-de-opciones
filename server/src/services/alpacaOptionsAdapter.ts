import type { AlpacaOptionContract, AlpacaOptionSnapshot } from "./alpacaOptionsService.js";
import type { OptionContract, OptionType } from "../types.js";

type AlpacaOptionsAdapterInput = {
  ticker: string;
  spot: number;
  contracts: AlpacaOptionContract[];
  snapshots: AlpacaOptionSnapshot[];
};

type AlpacaOptionsAdapterDiagnostics = {
  sourceContracts: number;
  sourceSnapshots: number;
  mappedContracts: number;
  rejectedContracts: number;
  missingBidAsk: number;
  missingGreeks: number;
  missingOpenInterest: number;
  missingVolume: number;
  expirations: string[];
  warnings: string[];
};

type AlpacaOptionsAdapterResult = {
  optionChain: OptionContract[];
  diagnostics: AlpacaOptionsAdapterDiagnostics;
};

export function mapAlpacaOptionsToOptionContracts({
  ticker,
  spot,
  contracts,
  snapshots,
}: AlpacaOptionsAdapterInput): AlpacaOptionsAdapterResult {
  const snapshotsBySymbol = new Map(snapshots.map((snapshot) => [snapshot.symbol, snapshot]));
  const warnings = new Set<string>();
  const diagnostics = {
    sourceContracts: contracts.length,
    sourceSnapshots: snapshots.length,
    mappedContracts: 0,
    rejectedContracts: 0,
    missingBidAsk: 0,
    missingGreeks: 0,
    missingOpenInterest: 0,
    missingVolume: 0,
    expirations: [] as string[],
    warnings,
  };
  const optionChain: OptionContract[] = [];

  for (const contract of contracts) {
    if (optionChain.length >= 300) {
      diagnostics.rejectedContracts += 1;
      warnings.add("Contract limit reached");
      continue;
    }

    const type = normalizeType(contract.type);
    const dte = calculateDte(contract.expiration);
    const isStrikeInRange = contract.strike >= spot * 0.7 && contract.strike <= spot * 1.3;

    if (!type || !Number.isFinite(contract.strike) || dte < 7 || dte > 60 || !isStrikeInRange) {
      diagnostics.rejectedContracts += 1;
      continue;
    }

    const snapshot = snapshotsBySymbol.get(contract.symbol);
    const bid = snapshot?.bid ?? 0;
    const ask = snapshot?.ask ?? 0;
    const hasBidAsk = bid > 0 && ask > 0;
    const last = snapshot?.last ?? (hasBidAsk ? (bid + ask) / 2 : 0);
    const volume = snapshot?.volume ?? 0;
    const openInterest = snapshot?.openInterest ?? 0;
    const impliedVolatility = snapshot?.impliedVolatility ?? estimateImpliedVolatility(contract.strike, spot);
    const greeksMissing =
      snapshot?.delta === undefined ||
      snapshot.gamma === undefined ||
      snapshot.theta === undefined ||
      snapshot.vega === undefined;

    if (!hasBidAsk) {
      diagnostics.missingBidAsk += 1;
      warnings.add("Bid/ask missing");
    }

    if (snapshot?.volume === undefined) {
      diagnostics.missingVolume += 1;
      warnings.add("Volume missing");
    }

    if (snapshot?.openInterest === undefined) {
      diagnostics.missingOpenInterest += 1;
      warnings.add("Open interest missing");
    }

    if (snapshot?.impliedVolatility === undefined) {
      warnings.add("IV estimated");
    }

    if (greeksMissing) {
      diagnostics.missingGreeks += 1;
      warnings.add("Greeks missing");
    }

    optionChain.push({
      symbol: contract.symbol,
      ticker,
      expiration: contract.expiration,
      dte,
      strike: contract.strike,
      type,
      bid,
      ask,
      last,
      volume,
      openInterest,
      impliedVolatility,
      delta: snapshot?.delta ?? 0,
      gamma: snapshot?.gamma ?? 0,
      theta: snapshot?.theta ?? 0,
      vega: snapshot?.vega ?? 0,
    });
  }

  const expirations = Array.from(new Set(optionChain.map((contract) => contract.expiration))).sort();

  return {
    optionChain,
    diagnostics: {
      sourceContracts: diagnostics.sourceContracts,
      sourceSnapshots: diagnostics.sourceSnapshots,
      mappedContracts: optionChain.length,
      rejectedContracts: diagnostics.rejectedContracts,
      missingBidAsk: diagnostics.missingBidAsk,
      missingGreeks: diagnostics.missingGreeks,
      missingOpenInterest: diagnostics.missingOpenInterest,
      missingVolume: diagnostics.missingVolume,
      expirations,
      warnings: Array.from(diagnostics.warnings),
    },
  };
}

function normalizeType(value: string): OptionType | null {
  const normalized = value.toLowerCase();

  if (normalized === "call" || normalized === "put") {
    return normalized;
  }

  return null;
}

function calculateDte(expiration: string): number {
  const expirationDate = new Date(`${expiration}T00:00:00Z`);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expirationUtc = Date.UTC(
    expirationDate.getUTCFullYear(),
    expirationDate.getUTCMonth(),
    expirationDate.getUTCDate(),
  );

  return Math.ceil((expirationUtc - todayUtc) / 86_400_000);
}

function estimateImpliedVolatility(strike: number, spot: number): number {
  const distance = Math.abs(strike - spot) / Math.max(spot, 1);

  if (distance <= 0.05) return 0.35;
  if (distance <= 0.2) return 0.45;
  return 0.6;
}
