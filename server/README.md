# Options Projection Dashboard Server

Mock mode:

```bash
DATA_PROVIDER=mock pnpm run dev
```

Alpaca market data mode:

```bash
DATA_PROVIDER=alpaca \
ALPACA_API_KEY=your_key \
ALPACA_SECRET_KEY=your_secret \
ALPACA_MARKET_DATA_BASE_URL=https://data.alpaca.markets \
pnpm run dev
```

Alpaca mode uses real stock quote and OHLCV bars for the selected market timeframe. Option chains remain mock until a later provider is added. No trading endpoints are implemented.

Market timeframe examples:

```bash
curl "http://localhost:4000/api/options/projection/AAPL?timeframe=5D_5M"
curl "http://localhost:4000/api/options/projection/AAPL?timeframe=30D_30M"
curl "http://localhost:4000/api/options/projection/AAPL?timeframe=3M_1D"
```

Timeframe mapping:

- `5D_5M`: Alpaca `5Min` bars, 7-day lookback, limit 500.
- `30D_30M`: Alpaca `30Min` bars, 35-day lookback, limit 500.
- `3M_1D`: Alpaca `1Day` bars, 100-day lookback, limit 100.

Responses include `marketTimeframe` with the resolved Alpaca timeframe and `candlesReturned`.

Test Alpaca options market data access:

```bash
curl http://localhost:4000/api/options/real-test/AAPL
curl http://localhost:4000/api/options/real-test/NVDA
```

Results:

- `ok: true`: the account appears to have access to Alpaca options contracts/snapshots.
- `ok: false` with a permission/authentication message: the account likely lacks options data access, the plan is not enabled, or credentials are invalid.
- Missing fields in `sampleSnapshots`: Alpaca may not provide Greeks, open interest, or volume for that contract/feed.

This test does not place orders and does not change the dashboard engine. `/api/options/projection/:ticker` continues to use mock option chains.

Test mapping real Alpaca options data into the internal `OptionContract` shape:

```bash
curl http://localhost:4000/api/options/real-chain/AAPL
curl http://localhost:4000/api/options/real-chain/NVDA
```

This endpoint does not feed the dashboard yet. It validates real option contracts/snapshots, normalizes them into the engine shape, and reports diagnostics about missing bid/ask, open interest, volume, IV, and Greeks. If open interest or Greeks are missing, the dashboard should continue using the mock options engine until quality is validated.

The same response includes `qualityReport`, a conservative gate for deciding whether real options data is ready:

- `usable`: the chain has enough contracts and enough bid/ask, volume, open interest, and IV coverage to consider experimental real-options analysis.
- `partial`: real contracts were detected, but critical fields such as open interest or Greeks are incomplete. Keep mock Greeks/levels until the data improves.
- `unusable`: the chain is too sparse or missing core fields. Keep the dashboard on mock options.

`/api/options/projection/:ticker` still uses mock option chains. The quality gate is observational only and does not enable trading or real options-driven dashboard output.
