import type { RawOptionProjectionInput } from "../types/options";
import type { DataProvider, DataProviderRequestOptions } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type UniverseResponse = {
  tickers: string[];
};

export const backendDataProvider: DataProvider = {
  name: "Backend",
  async getUniverse(options) {
    const universeResponse = await requestJson<UniverseResponse>("/api/market/universe");

    return Promise.all(universeResponse.tickers.map((ticker) => getRequiredTickerData(ticker, options)));
  },
  async getTickerData(ticker: string, options) {
    const normalizedTicker = ticker.trim().toUpperCase();
    const searchParams = new URLSearchParams();
    if (options?.timeframe) {
      searchParams.set("timeframe", options.timeframe);
    }
    const query = searchParams.toString();
    let response: Response;

    try {
      response = await fetch(
        `${API_BASE_URL}/api/options/projection/${encodeURIComponent(normalizedTicker)}${query ? `?${query}` : ""}`,
      );
    } catch {
      throw new Error("Backend provider unavailable. Start server on port 4000 or switch VITE_DATA_PROVIDER=mock.");
    }

    if (response.status === 404) {
      const errorMessage = await readErrorMessage(response);

      if (errorMessage.includes("no bars")) {
        throw new Error(errorMessage);
      }

      return null;
    }

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      throw new Error(errorMessage || `Backend provider failed for ${normalizedTicker}: ${response.status}`);
    }

    return response.json() as Promise<RawOptionProjectionInput>;
  },
};

async function getRequiredTickerData(ticker: string, options?: DataProviderRequestOptions): Promise<RawOptionProjectionInput> {
  const data = await backendDataProvider.getTickerData(ticker, options);

  if (!data) {
    throw new Error(`Backend provider returned no projection for ${ticker}.`);
  }

  return data;
}

async function requestJson<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error("Backend provider unavailable. Start server on port 4000 or switch VITE_DATA_PROVIDER=mock.");
  }

  if (!response.ok) {
    throw new Error(`Backend provider request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };

    return payload.error ?? "";
  } catch {
    return "";
  }
}
