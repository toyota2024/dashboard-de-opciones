import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { getTickerProjection, getUniverseTickers } from "../services/mockMarketService.js";
import {
  AlpacaMarketDataError,
  buildQuoteSnapshot,
  getAlpacaHistoricalBars,
  getAlpacaLatestQuote,
} from "../services/alpacaMarketService.js";
import { getStartDateForTimeframe, resolveMarketTimeframe } from "../services/marketTimeframeService.js";

const tickerSchema = z
  .string()
  .trim()
  .min(1)
  .max(10)
  .regex(/^[A-Z0-9.-]+$/i)
  .transform((value) => value.toUpperCase());

export const marketRoutes = Router();

marketRoutes.get("/universe", (_request, response) => {
  response.json({ tickers: getUniverseTickers() });
});

marketRoutes.get("/ticker/:ticker", async (request, response) => {
  const result = tickerSchema.safeParse(request.params.ticker);

  if (!result.success) {
    response.status(400).json({ error: "Invalid ticker" });
    return;
  }

  if (getDataProviderName() === "alpaca") {
    try {
      const marketTimeframe = resolveMarketTimeframe(readTimeframeQuery(request.query.timeframe));
      const [quote, historicalPath] = await Promise.all([
        getAlpacaLatestQuote(result.data),
        getAlpacaHistoricalBars(result.data, {
          timeframe: marketTimeframe.alpacaTimeframe,
          start: getStartDateForTimeframe(marketTimeframe),
          limit: marketTimeframe.limit,
        }),
      ]);

      response.json({
        quote: buildQuoteSnapshot(quote),
        historicalPath,
        marketTimeframe: {
          ...marketTimeframe,
          candlesReturned: historicalPath.length,
        },
      });
    } catch (error) {
      sendMarketDataError(response, error);
    }

    return;
  }

  const projection = getTickerProjection(result.data);

  if (!projection) {
    response.status(404).json({ error: "Ticker not found" });
    return;
  }

  response.json({
    quote: projection.quote,
    historicalPath: projection.historicalPath,
    marketTimeframe: getMockMarketTimeframe(readTimeframeQuery(request.query.timeframe), projection.historicalPath.length),
  });
});

function getDataProviderName(): string {
  return (process.env.DATA_PROVIDER ?? "mock").toLowerCase();
}

function sendMarketDataError(response: Response, error: unknown) {
  if (error instanceof AlpacaMarketDataError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(502).json({ error: "Alpaca market data unavailable" });
}

function readTimeframeQuery(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getMockMarketTimeframe(value: string | undefined, candlesReturned: number) {
  const config = resolveMarketTimeframe(value);

  return {
    ...config,
    candlesReturned,
  };
}
