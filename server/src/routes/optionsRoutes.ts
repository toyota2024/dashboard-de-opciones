import { Router } from "express";
import { z } from "zod";
import { getTickerProjection } from "../services/mockMarketService.js";
import { AlpacaMarketDataError, getAlpacaLatestQuote, getAlpacaMarketProjectionInput } from "../services/alpacaMarketService.js";
import {
  getAlpacaOptionContracts,
  getAlpacaOptionSnapshots,
  testAlpacaOptionsData,
} from "../services/alpacaOptionsService.js";
import { mapAlpacaOptionsToOptionContracts } from "../services/alpacaOptionsAdapter.js";
import { evaluateOptionsDataQuality } from "../services/optionsDataQualityGate.js";
import { resolveMarketTimeframe } from "../services/marketTimeframeService.js";

const tickerSchema = z
  .string()
  .trim()
  .min(1)
  .max(10)
  .regex(/^[A-Z0-9.-]+$/i)
  .transform((value) => value.toUpperCase());

export const optionsRoutes = Router();

optionsRoutes.get("/real-test/:ticker", async (request, response) => {
  const result = tickerSchema.safeParse(request.params.ticker);

  if (!result.success) {
    response.status(400).json({ ok: false, provider: "alpaca", error: "Invalid ticker" });
    return;
  }

  response.json(await testAlpacaOptionsData(result.data));
});

optionsRoutes.get("/real-chain/:ticker", async (request, response) => {
  const result = tickerSchema.safeParse(request.params.ticker);

  if (!result.success) {
    response.status(400).json({ ok: false, provider: "alpaca", error: "Invalid ticker" });
    return;
  }

  try {
    const [quote, contracts, snapshots] = await Promise.all([
      getAlpacaLatestQuote(result.data),
      getAlpacaOptionContracts(result.data),
      getAlpacaOptionSnapshots(result.data),
    ]);
    const mapped = mapAlpacaOptionsToOptionContracts({
      ticker: result.data,
      spot: quote.price,
      contracts,
      snapshots,
    });
    const qualityReport = evaluateOptionsDataQuality(mapped.optionChain);

    response.json({
      ok: true,
      provider: "alpaca",
      underlying: result.data,
      spot: quote.price,
      optionChain: mapped.optionChain,
      diagnostics: mapped.diagnostics,
      qualityReport,
    });
  } catch (error) {
    response.status(502).json({
      ok: false,
      provider: "alpaca",
      error: error instanceof Error ? error.message : "Alpaca options data unavailable or not enabled for this account",
    });
  }
});

optionsRoutes.get("/chain/:ticker", async (request, response) => {
  const projection = await getProjectionFromRequest(request.params.ticker, readTimeframeQuery(request.query.timeframe));

  if (!projection.ok) {
    response.status(projection.status).json({ error: projection.message });
    return;
  }

  response.json({
    ticker: projection.data.quote.ticker,
    optionChain: projection.data.optionChain,
  });
});

optionsRoutes.get("/projection/:ticker", async (request, response) => {
  const projection = await getProjectionFromRequest(request.params.ticker, readTimeframeQuery(request.query.timeframe));

  if (!projection.ok) {
    response.status(projection.status).json({ error: projection.message });
    return;
  }

  response.json(projection.data);
});

async function getProjectionFromRequest(ticker: string, timeframe: string | undefined) {
  const result = tickerSchema.safeParse(ticker);

  if (!result.success) {
    return { ok: false as const, status: 400, message: "Invalid ticker" };
  }

  if (getDataProviderName() === "alpaca") {
    try {
      return { ok: true as const, data: await getAlpacaMarketProjectionInput(result.data, resolveMarketTimeframe(timeframe).key) };
    } catch (error) {
      if (error instanceof AlpacaMarketDataError) {
        return { ok: false as const, status: error.status, message: error.message };
      }

      return { ok: false as const, status: 502, message: "Alpaca market data unavailable" };
    }
  }

  const projection = getTickerProjection(result.data);

  if (!projection) {
    return { ok: false as const, status: 404, message: "Ticker not found" };
  }

  return {
    ok: true as const,
    data: {
      ...projection,
      marketTimeframe: {
        ...resolveMarketTimeframe(timeframe),
        candlesReturned: projection.historicalPath.length,
      },
    },
  };
}

function getDataProviderName(): string {
  return (process.env.DATA_PROVIDER ?? "mock").toLowerCase();
}

function readTimeframeQuery(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
