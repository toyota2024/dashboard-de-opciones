export type AlpacaOptionContract = {
  underlying: string;
  symbol: string;
  expiration: string;
  strike: number;
  type: string;
  status: string;
  style: string;
};

export type AlpacaOptionSnapshot = {
  symbol: string;
  bid?: number;
  ask?: number;
  last?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
};

export type AlpacaOptionsRealTestResult =
  | {
      ok: true;
      provider: "alpaca";
      underlying: string;
      contractsCount: number;
      sampleContracts: AlpacaOptionContract[];
      sampleSnapshots: AlpacaOptionSnapshot[];
    }
  | {
      ok: false;
      provider: "alpaca";
      error: string;
    };

class AlpacaOptionsDataError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function getAlpacaOptionContracts(ticker: string): Promise<AlpacaOptionContract[]> {
  const today = new Date();
  const expirationGte = addDays(today, 7);
  const expirationLte = addDays(today, 60);
  const response = await alpacaFetchTrading<Record<string, unknown>>("/v2/options/contracts", {
    underlying_symbols: ticker,
    status: "active",
    expiration_date_gte: formatIsoDate(expirationGte),
    expiration_date_lte: formatIsoDate(expirationLte),
    limit: "1000",
  });
  const contracts = asArray(response.option_contracts);

  return contracts.map(normalizeContract).filter((contract) => contract.symbol);
}

export async function getAlpacaOptionSnapshots(ticker: string): Promise<AlpacaOptionSnapshot[]> {
  const response = await alpacaFetchMarket<Record<string, unknown>>(`/v1beta1/options/snapshots/${encodeURIComponent(ticker)}`, {
    limit: "50",
  });
  const snapshots = asRecord(response.snapshots);

  return Object.entries(snapshots).map(([symbol, value]) => normalizeSnapshot(symbol, value));
}

export async function testAlpacaOptionsData(ticker: string): Promise<AlpacaOptionsRealTestResult> {
  try {
    const contracts = await getAlpacaOptionContracts(ticker);
    const snapshots = await getAlpacaOptionSnapshots(ticker);

    if (contracts.length === 0 && snapshots.length === 0) {
      return {
        ok: false,
        provider: "alpaca",
        error: "Ticker not found or no option contracts found",
      };
    }

    return {
      ok: true,
      provider: "alpaca",
      underlying: ticker,
      contractsCount: contracts.length,
      sampleContracts: contracts.slice(0, 10),
      sampleSnapshots: snapshots.slice(0, 10),
    };
  } catch (error) {
    return {
      ok: false,
      provider: "alpaca",
      error: normalizeOptionsError(error),
    };
  }
}

async function alpacaFetchMarket<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
  const baseUrl = process.env.ALPACA_MARKET_DATA_BASE_URL ?? "https://data.alpaca.markets";

  return alpacaFetch<T>(baseUrl, path, queryParams);
}

async function alpacaFetchTrading<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
  const baseUrl = process.env.ALPACA_TRADING_BASE_URL ?? "https://paper-api.alpaca.markets";

  return alpacaFetch<T>(baseUrl, path, queryParams);
}

async function alpacaFetch<T>(baseUrl: string, path: string, queryParams: Record<string, string>): Promise<T> {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey || apiKey.includes("PEGAR_AQUI") || secretKey.includes("PEGAR_AQUI")) {
    throw new AlpacaOptionsDataError("Missing Alpaca credentials in server/.env", 502);
  }

  const url = new URL(path, baseUrl);
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });
  } catch {
    throw new AlpacaOptionsDataError("Alpaca options data unavailable or not enabled for this account", 502);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AlpacaOptionsDataError("Alpaca options permission or authentication failed", 403);
  }

  if (response.status === 404) {
    throw new AlpacaOptionsDataError("Ticker or option contracts not found", 404);
  }

  if (response.status === 429) {
    throw new AlpacaOptionsDataError("Alpaca options data rate limit reached", 429);
  }

  if (!response.ok) {
    throw new AlpacaOptionsDataError("Alpaca options data unavailable or not enabled for this account", 502);
  }

  return response.json() as Promise<T>;
}

function normalizeContract(value: unknown): AlpacaOptionContract {
  const record = asRecord(value);

  return {
    underlying: asString(record.underlying_symbol),
    symbol: asString(record.symbol),
    expiration: asString(record.expiration_date),
    strike: asNumber(record.strike_price),
    type: asString(record.type),
    status: asString(record.status),
    style: asString(record.style),
  };
}

function normalizeSnapshot(symbol: string, value: unknown): AlpacaOptionSnapshot {
  const record = asRecord(value);
  const latestQuote = asRecord(record.latestQuote);
  const latestTrade = asRecord(record.latestTrade);
  const greeks = asRecord(record.greeks);
  const impliedVolatility = record.impliedVolatility ?? record.iv;

  return {
    symbol,
    bid: optionalNumber(latestQuote.bp),
    ask: optionalNumber(latestQuote.ap),
    last: optionalNumber(latestTrade.p),
    volume: optionalNumber(record.volume),
    openInterest: optionalNumber(record.openInterest),
    impliedVolatility: optionalNumber(impliedVolatility),
    delta: optionalNumber(greeks.delta),
    gamma: optionalNumber(greeks.gamma),
    theta: optionalNumber(greeks.theta),
    vega: optionalNumber(greeks.vega),
  };
}

function normalizeOptionsError(error: unknown): string {
  if (error instanceof AlpacaOptionsDataError) {
    return error.message;
  }

  return "Alpaca options data unavailable or not enabled for this account";
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: unknown): number | undefined {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);

  return copy;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
