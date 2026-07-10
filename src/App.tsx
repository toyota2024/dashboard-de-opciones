import { useEffect, useMemo, useRef, useState } from "react";
import { AutoEvaluationControls } from "./components/AutoEvaluationControls";
import { DataModeToggle } from "./components/DataModeToggle";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { DataSourceBadges } from "./components/DataSourceBadges";
import { ExpectedMovePanel } from "./components/ExpectedMovePanel";
import { GlossaryPanel } from "./components/GlossaryPanel";
import { Header } from "./components/Header";
import { HistoryBackupPanel } from "./components/HistoryBackupPanel";
import { InfoTooltip } from "./components/InfoTooltip";
import { LanguageToggle } from "./components/LanguageToggle";
import { ModelControlPanel } from "./components/ModelControlPanel";
import { MultiTickerScreener } from "./components/MultiTickerScreener";
import { OptionChainPanel } from "./components/OptionChainPanel";
import { PerformanceSummaryPanel } from "./components/PerformanceSummaryPanel";
import { ProjectionChart } from "./components/ProjectionChart";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { SignalHistoryPanel } from "./components/SignalHistoryPanel";
import { StrikeConcentrationPanel } from "./components/StrikeConcentrationPanel";
import { TradeReadPanel } from "./components/TradeReadPanel";
import { WatchlistManager } from "./components/WatchlistManager";
import {
  defaultAutoEvaluationRule,
  evaluateSignalAgainstCandles,
} from "./lib/autoEvaluationEngine";
import { createSignalSnapshotFromScreenerRow } from "./lib/createSignalSnapshot";
import { getDataSourceCopy } from "./lib/dataSourceCopy";
import { t, type Language } from "./lib/i18n";
import {
  calculatePerformanceSummary,
  calculateReturnPercent,
  evaluateOpenSignals,
  suggestOutcomeFromReturn,
} from "./lib/performanceEngine";
import { buildProjectionModel } from "./lib/projectionModel";
import { buildScreenerRows } from "./lib/screenerModel";
import {
  addSignalSnapshot,
  archiveSignalSnapshot,
  clearSignalHistory,
  deleteSignalSnapshot,
  getSignalHistory,
  saveSignalHistory,
  updateSignalSnapshot,
} from "./lib/signalHistoryStorage";
import { getDataProvider } from "./providers/providerRegistry";
import type { ProviderName } from "./providers/providerRegistry";
import type {
  ActiveView,
  AutoEvaluationResult,
  AutoEvaluationRule,
  DataSourceStatus,
  HeaderSnapshot,
  ModelConfig,
  ModelControlState,
  PricePoint,
  RawOptionProjectionInput,
  ScreenerRow,
  ScreenerSignalSnapshot,
  SignalEvaluation,
  SignalOutcome,
  SelectedTimeframe,
} from "./types/options";

type SkippedTicker = {
  ticker: string;
  error: string;
};

const watchlistStorageKey = "options-dashboard-watchlist";
const autoEvaluationRuleStorageKey = "options-dashboard-auto-evaluation-rule";
const dataProviderModeStorageKey = "options-dashboard-data-provider-mode";
const languageStorageKey = "options-dashboard-language";
const lastTickerStorageKey = "options-dashboard-last-ticker";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const defaultMockWatchlist = ["MU", "AMD", "NVDA", "TSLA", "AAPL", "HOOD"];
const defaultBackendWatchlist = ["AMD", "NVDA", "AAPL", "MSFT", "META", "TSLA", "SPY", "QQQ"];
const fallbackModelConfig: ModelConfig = {
  minOpenInterest: 450,
  minVolume: 60,
  maxBidAskSpreadPercent: 0.18,
  maxThetaPercentOfPremium: 0.08,
  preferredDteMin: 16,
  preferredDteMax: 30,
};

function App() {
  const [providerName, setProviderName] = useState<ProviderName>(() => getStoredProviderName());
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  const provider = useMemo(() => getDataProvider(providerName), [providerName]);
  const configuredProvider = import.meta.env.VITE_DATA_PROVIDER;
  const providerWarning =
    configuredProvider && configuredProvider !== "mock" && configuredProvider !== "backend"
      ? `Unknown data provider "${configuredProvider}". Falling back to Mock.`
      : "";
  const [rawUniverse, setRawUniverse] = useState<RawOptionProjectionInput[]>([]);
  const [activeUniverseTickers, setActiveUniverseTickers] = useState<string[]>(getInitialWatchlist(providerName));
  const [screenerErrors, setScreenerErrors] = useState<SkippedTicker[]>([]);
  const [signalHistory, setSignalHistory] = useState<ScreenerSignalSnapshot[]>(() => getSignalHistory());
  const [signalEvaluations, setSignalEvaluations] = useState<SignalEvaluation[]>([]);
  const [autoEvaluationRule, setAutoEvaluationRule] = useState<Required<AutoEvaluationRule>>(() => getStoredAutoEvaluationRule());
  const [autoEvaluationResults, setAutoEvaluationResults] = useState<AutoEvaluationResult[]>([]);
  const [autoEvaluationError, setAutoEvaluationError] = useState("");
  const [evaluationErrors, setEvaluationErrors] = useState<SkippedTicker[]>([]);
  const [isEvaluatingSignals, setIsEvaluatingSignals] = useState(false);
  const [selectedRawData, setSelectedRawData] = useState<RawOptionProjectionInput | null>(null);
  const [controlState, setControlState] = useState<ModelControlState | null>(null);
  const [appliedConfig, setAppliedConfig] = useState<ModelConfig | null>(null);
  const [selectedTicker, setSelectedTicker] = useState("MU");
  const [selectedTimeframe, setSelectedTimeframe] = useState<SelectedTimeframe>("3M_1D");
  const [activeView, setActiveView] = useState<ActiveView>("projections");
  const [controlError, setControlError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenerLoading, setIsScreenerLoading] = useState(false);
  const [error, setError] = useState("");
  const timeframeRequestId = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setIsScreenerLoading(true);
        const initialTickers = getInitialWatchlist(providerName);
        const lastTicker = providerName === "backend" ? getLastTicker() : "MU";
        const [universeResult, defaultRawData] = await Promise.all([
          loadUniverseByTickers(initialTickers, selectedTimeframe),
          lastTicker ? provider.getTickerData(lastTicker, { timeframe: selectedTimeframe }) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (providerName === "mock" && !defaultRawData && universeResult.data.length === 0) {
          setError("No data returned by provider.");
          return;
        }

        const initialRawData = providerName === "mock" ? defaultRawData ?? universeResult.data[0] : defaultRawData;
        const initialConfig = initialRawData?.modelConfig ?? universeResult.data[0]?.modelConfig ?? fallbackModelConfig;
        const initialTicker = initialRawData?.quote.ticker ?? "";

        setActiveUniverseTickers(initialTickers);
        setRawUniverse(universeResult.data);
        setScreenerErrors(universeResult.errors);
        setSelectedRawData(initialRawData ?? null);
        setSelectedTicker(initialTicker);
        setAppliedConfig(initialConfig);
        setControlState({
          ticker: initialTicker,
          ...initialConfig,
        });
        setError("");
      } catch (caughtError) {
        if (isMounted) {
          setError(getProviderErrorMessage(caughtError, "Data provider failed to load universe."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsScreenerLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [provider, providerName]);

  useEffect(() => {
    saveProviderName(providerName);
  }, [providerName]);

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  const data = useMemo(() => {
    if (!selectedRawData || !appliedConfig) return null;

    return buildProjectionModel(applyConfigToRawData(selectedRawData, appliedConfig));
  }, [appliedConfig, selectedRawData]);
  const screenerRows = useMemo(() => {
    if (!appliedConfig) return [];

    return buildScreenerRows(rawUniverse, appliedConfig);
  }, [appliedConfig, rawUniverse]);
  const performanceSummary = useMemo(() => calculatePerformanceSummary(signalHistory), [signalHistory]);
  const openSignalsCount = useMemo(
    () => signalHistory.filter((signal) => signal.status === "open").length,
    [signalHistory],
  );

  useEffect(() => {
    saveAutoEvaluationRule(autoEvaluationRule);
  }, [autoEvaluationRule]);

  async function runAnalysis() {
    if (!controlState) return;

    const validationError = validateControlState(controlState, providerName);

    if (validationError) {
      setControlError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setControlError("");
      const nextConfig = getConfigFromControlState(controlState);
      const nextTicker = controlState.ticker.trim().toUpperCase();
      const tickerData = await provider.getTickerData(nextTicker, { timeframe: selectedTimeframe });

      if (!tickerData) {
        setControlError(getTickerNotFoundMessage(providerName));
        return;
      }

      setAppliedConfig(nextConfig);
      setSelectedTicker(nextTicker);
      setSelectedRawData(tickerData);
      saveLastTicker(nextTicker);
      setError("");
    } catch (caughtError) {
      setControlError(getProviderErrorMessage(caughtError, getTickerNotFoundMessage(providerName)));
    } finally {
      setIsLoading(false);
    }
  }

  async function resetDefaults() {
    if (providerName === "backend") {
      setControlState((current) => (current ? { ...current, ticker: "" } : { ticker: "", ...fallbackModelConfig }));
      setAppliedConfig(fallbackModelConfig);
      clearSelectedTicker();
      return;
    }

    try {
      setIsLoading(true);
      setControlError("");
      const defaultRawData = (await provider.getTickerData("MU", { timeframe: selectedTimeframe })) ?? rawUniverse[0] ?? null;

      if (!defaultRawData) {
        setError("No default ticker found in provider.");
        return;
      }

      setControlState({
        ticker: defaultRawData.quote.ticker,
        ...defaultRawData.modelConfig,
      });
      setAppliedConfig(defaultRawData.modelConfig);
      setSelectedTicker(defaultRawData.quote.ticker);
      setSelectedRawData(defaultRawData);
      saveLastTicker(defaultRawData.quote.ticker);
      setError("");
    } catch (caughtError) {
      setError(getProviderErrorMessage(caughtError, "Data provider failed while resetting defaults."));
    } finally {
      setIsLoading(false);
    }
  }

  function applyPreset(preset: Omit<ModelControlState, "ticker">) {
    if (!controlState) return;

    setControlError("");
    setControlState({ ...controlState, ...preset });
  }

  async function openTicker(ticker: string) {
    try {
      setIsLoading(true);
      setControlError("");
      const tickerData = await provider.getTickerData(ticker, { timeframe: selectedTimeframe });

      if (!tickerData) {
        setError(`Provider returned no data for ${ticker}.`);
        return;
      }

      setSelectedTicker(tickerData.quote.ticker);
      setSelectedRawData(tickerData);
      setControlState((current) => (current ? { ...current, ticker: tickerData.quote.ticker } : current));
      saveLastTicker(tickerData.quote.ticker);
      setError("");
    } catch (caughtError) {
      setError(getProviderErrorMessage(caughtError, `Data provider failed while opening ${ticker}.`));
    } finally {
      setIsLoading(false);
    }
  }

  async function changeTimeframe(nextTimeframe: SelectedTimeframe) {
    setSelectedTimeframe(nextTimeframe);

    if (providerName !== "backend") {
      return;
    }

    const requestId = timeframeRequestId.current + 1;
    timeframeRequestId.current = requestId;

    try {
      setIsLoading(true);
      setIsScreenerLoading(true);
      const [tickerData, universeResult] = await Promise.all([
        selectedTicker ? provider.getTickerData(selectedTicker, { timeframe: nextTimeframe }) : Promise.resolve(null),
        loadUniverseByTickers(activeUniverseTickers, nextTimeframe),
      ]);

      if (timeframeRequestId.current !== requestId) return;

      if (selectedTicker && !tickerData) {
        setError(`Provider returned no data for ${selectedTicker}.`);
        return;
      }

      setSelectedRawData(tickerData);
      setRawUniverse(universeResult.data);
      setScreenerErrors(universeResult.errors);
      setError("");
    } catch (caughtError) {
      if (timeframeRequestId.current === requestId) {
        setError(getProviderErrorMessage(caughtError, "Data provider failed while loading selected timeframe."));
      }
    } finally {
      if (timeframeRequestId.current === requestId) {
        setIsLoading(false);
        setIsScreenerLoading(false);
      }
    }
  }

  async function applyWatchlist(tickers: string[]) {
    const nextTickers = tickers.slice(0, 25);

    setActiveUniverseTickers(nextTickers);
    saveWatchlist(nextTickers);
    setIsScreenerLoading(true);

    try {
      const universeResult = await loadUniverseByTickers(nextTickers, selectedTimeframe);

      setRawUniverse(universeResult.data);
      setScreenerErrors(universeResult.errors);
    } finally {
      setIsScreenerLoading(false);
    }
  }

  async function resetWatchlist() {
    const defaults = getDefaultWatchlist(providerName);

    setActiveUniverseTickers(defaults);
    clearSavedWatchlist();
    setIsScreenerLoading(true);

    try {
      const universeResult = await loadUniverseByTickers(defaults, selectedTimeframe);

      setRawUniverse(universeResult.data);
      setScreenerErrors(universeResult.errors);
    } finally {
      setIsScreenerLoading(false);
    }
  }

  function changeProviderMode(nextProviderName: ProviderName) {
    setProviderName(nextProviderName);
    setError("");
    setControlError("");
    setScreenerErrors([]);
    setEvaluationErrors([]);
    setIsLoading(true);
  }

  async function selectTickerFromSearch(ticker: string) {
    setControlState((current) => (current ? { ...current, ticker } : current));
    await openTicker(ticker);
  }

  function clearSelectedTicker() {
    clearLastTicker();
    setSelectedTicker("");
    setSelectedRawData(null);
    setControlState((current) => (current ? { ...current, ticker: "" } : current));
    setError("");
    setControlError("");
  }

  function trackSignal(row: ScreenerRow) {
    const today = new Date().toISOString().slice(0, 10);
    const hasDuplicateSameDay = signalHistory.some(
      (signal) =>
        signal.status === "open" &&
        signal.ticker === row.ticker &&
        signal.timeframe === selectedTimeframe &&
        signal.createdAt.slice(0, 10) === today,
    );
    const signal = createSignalSnapshotFromScreenerRow({
      row,
      timeframe: selectedTimeframe,
      dataSource: data?.dataSource ?? {
        marketData: "mock",
        marketDataProvider: "mock",
        optionsData: "mock",
        optionsDataProvider: "mock",
        lastUpdated: new Date().toISOString(),
      },
      notes: hasDuplicateSameDay ? "Duplicate same-day signal" : undefined,
    });

    setSignalHistory(addSignalSnapshot(signal));
  }

  function archiveSignal(id: string) {
    setSignalHistory(archiveSignalSnapshot(id));
  }

  function deleteSignal(id: string) {
    setSignalHistory(deleteSignalSnapshot(id));
  }

  function clearSignals() {
    clearSignalHistory();
    setSignalHistory([]);
    setSignalEvaluations([]);
    setAutoEvaluationResults([]);
    setEvaluationErrors([]);
  }

  function importSignalHistory(signals: ScreenerSignalSnapshot[]) {
    saveSignalHistory(signals);
    setSignalHistory(signals);
    setSignalEvaluations([]);
    setAutoEvaluationResults([]);
    setEvaluationErrors([]);
  }

  async function evaluateSignals() {
    const openSignals = signalHistory.filter((signal) => signal.status === "open");
    const latestPricesByTicker: Record<string, number> = {};
    const errors: SkippedTicker[] = [];

    setIsEvaluatingSignals(true);

    try {
      const settled = await Promise.allSettled(
        openSignals.map(async (signal) => {
          const price = await fetchLatestPriceForTicker(signal.ticker, signal.timeframe);

          return { ticker: signal.ticker, price };
        }),
      );

      settled.forEach((result, index) => {
        const ticker = openSignals[index].ticker;

        if (result.status === "fulfilled") {
          latestPricesByTicker[result.value.ticker] = result.value.price;
          return;
        }

        errors.push({
          ticker,
          error: getProviderErrorMessage(result.reason, "Unable to fetch latest price."),
        });
      });

      setSignalEvaluations(evaluateOpenSignals(openSignals, latestPricesByTicker));
      setEvaluationErrors(errors);
    } finally {
      setIsEvaluatingSignals(false);
    }
  }

  async function autoEvaluateOpenSignals() {
    const openSignals = signalHistory.filter((signal) => signal.status === "open");
    const closedUpdates = new Map<string, AutoEvaluationResult>();
    const openResults: AutoEvaluationResult[] = [];
    const errors: SkippedTicker[] = [];
    const validationError = validateAutoEvaluationRule(autoEvaluationRule);

    if (validationError) {
      setAutoEvaluationError(validationError);
      return;
    }

    setIsEvaluatingSignals(true);
    setAutoEvaluationError("");

    try {
      const settled = await Promise.allSettled(
        openSignals.map(async (signal) => {
          const candles = await fetchHistoricalCandlesForSignal(signal);

          return evaluateSignalAgainstCandles(signal, candles, autoEvaluationRule);
        }),
      );

      settled.forEach((result, index) => {
        const signal = openSignals[index];

        if (result.status === "rejected") {
          errors.push({
            ticker: signal.ticker,
            error: getProviderErrorMessage(result.reason, "Unable to fetch candles for auto evaluation."),
          });
          return;
        }

        if (result.value.status === "closed") {
          closedUpdates.set(result.value.signalId, result.value);
        } else {
          openResults.push(result.value);
        }
      });

      if (closedUpdates.size > 0) {
        const nextSignals = signalHistory.map((signal) => {
          const result = closedUpdates.get(signal.id);

          if (!result || signal.status !== "open") {
            return signal;
          }

          return {
            ...signal,
            status: "closed" as const,
            outcome: result.outcome,
            exitPrice: result.exitPrice,
            returnPercent: result.returnPercent,
            closedAt: result.closedAt,
            notes: appendAutoEvaluationNote(signal.notes, result.reason),
          };
        });

        saveSignalHistory(nextSignals);
        setSignalHistory(nextSignals);
      }

      setAutoEvaluationResults([...closedUpdates.values(), ...openResults]);
      setEvaluationErrors(errors);
    } finally {
      setIsEvaluatingSignals(false);
    }
  }

  function closeSignal(id: string, outcome: SignalOutcome) {
    const signal = signalHistory.find((item) => item.id === id);
    if (!signal) return;

    const exitPrice = getExitPriceForSignal(signal);
    if (!exitPrice) return;

    const returnPercent = calculateReturnPercent(signal.price, exitPrice);
    const closedAt = new Date().toISOString();

    setSignalHistory(
      updateSignalSnapshot(id, {
        status: "closed",
        outcome,
        exitPrice,
        closedAt,
        returnPercent,
      }),
    );
  }

  function closeSignalAtCurrentPrice(id: string) {
    const signal = signalHistory.find((item) => item.id === id);
    if (!signal) return;

    const exitPrice = getExitPriceForSignal(signal);
    if (!exitPrice) return;

    const returnPercent = calculateReturnPercent(signal.price, exitPrice);

    setSignalHistory(
      updateSignalSnapshot(id, {
        status: "closed",
        outcome: suggestOutcomeFromReturn(returnPercent),
        exitPrice,
        closedAt: new Date().toISOString(),
        returnPercent,
      }),
    );
  }

  function getExitPriceForSignal(signal: ScreenerSignalSnapshot): number | null {
    const evaluatedPrice = signalEvaluations.find((evaluation) => evaluation.signalId === signal.id)?.currentPrice;

    if (evaluatedPrice && evaluatedPrice > 0) {
      return evaluatedPrice;
    }

    const promptedValue = window.prompt("Exit price?");
    const exitPrice = promptedValue ? Number(promptedValue) : 0;

    if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
      window.alert("Exit price must be a valid number greater than 0.");
      return null;
    }

    return exitPrice;
  }

  async function fetchLatestPriceForTicker(ticker: string, timeframe: SelectedTimeframe): Promise<number> {
    if (providerName === "backend") {
      const response = await fetch(
        `${API_BASE_URL}/api/market/ticker/${encodeURIComponent(ticker)}?timeframe=${encodeURIComponent(timeframe)}`,
      );

      if (!response.ok) {
        throw new Error("Ticker not found by Alpaca or no market data available.");
      }

      const payload = (await response.json()) as { quote?: { price?: number } };
      const price = payload.quote?.price;

      if (!price) {
        throw new Error("No latest price returned.");
      }

      return price;
    }

    const rawData =
      rawUniverse.find((item) => item.quote.ticker === ticker) ??
      (selectedRawData?.quote.ticker === ticker ? selectedRawData : undefined);

    if (!rawData) {
      throw new Error("Ticker not found in mock universe.");
    }

    return rawData.quote.price;
  }

  async function fetchHistoricalCandlesForSignal(signal: ScreenerSignalSnapshot): Promise<PricePoint[]> {
    if (providerName === "backend") {
      const response = await fetch(
        `${API_BASE_URL}/api/options/projection/${encodeURIComponent(signal.ticker)}?timeframe=${encodeURIComponent(signal.timeframe)}`,
      );

      if (!response.ok) {
        throw new Error("Ticker not found by Alpaca or no market data available.");
      }

      const payload = (await response.json()) as { historicalPath?: PricePoint[] };

      return payload.historicalPath ?? [];
    }

    const rawData =
      rawUniverse.find((item) => item.quote.ticker === signal.ticker) ??
      (selectedRawData?.quote.ticker === signal.ticker ? selectedRawData : undefined);

    if (!rawData) {
      throw new Error("Ticker not found in mock universe.");
    }

    return rawData.historicalPath;
  }

  async function loadUniverseByTickers(tickers: string[], timeframe: SelectedTimeframe) {
    const settled = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const data = await provider.getTickerData(ticker, { timeframe });

        if (!data) {
          throw new Error(getTickerNotFoundMessage(providerName));
        }

        return data;
      }),
    );
    const data: RawOptionProjectionInput[] = [];
    const errors: SkippedTicker[] = [];

    settled.forEach((result, index) => {
      const ticker = tickers[index];

      if (result.status === "fulfilled") {
        data.push(result.value);
        return;
      }

      errors.push({
        ticker,
        error: getProviderErrorMessage(result.reason, getTickerNotFoundMessage(providerName)),
      });
    });

    return { data, errors };
  }

  if (isLoading && !data) {
    return (
      <main className="app-shell">
        <div className="status-panel">{providerName === "backend" ? t("providerBackendActive", language) : t("providerMockActive", language)}</div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="app-shell">
        <div className="status-panel status-panel--error">{error}</div>
        <section className="mode-toolbar" aria-label="Data mode and language">
          <DataModeToggle mode={providerName} language={language} onChange={changeProviderMode} />
          <LanguageToggle language={language} onChange={setLanguage} />
        </section>
        {providerName === "backend" && (
          <div className="status-panel status-panel--error">
            {t("backendUnavailable", language)}
            <button className="secondary-action" onClick={() => changeProviderMode("mock")} type="button">
              {t("backToSimulation", language)}
            </button>
          </div>
        )}
      </main>
    );
  }

  if (!controlState) {
    return null;
  }

  const activeDataSource = data?.dataSource ?? getEmptyDataSource(providerName);
  const dataSourceCopy = getDataSourceCopy(activeDataSource, language);
  const headerSnapshot = data?.header ?? getEmptyHeaderSnapshot();

  return (
    <main className="app-shell">
      <Header
        snapshot={headerSnapshot}
        selectedTimeframe={selectedTimeframe}
        activeView={activeView}
        language={language}
        onTimeframeChange={changeTimeframe}
        onActiveViewChange={setActiveView}
      />

      {error && <div className="status-panel status-panel--error">{error}</div>}
      {isLoading && data && <div className="status-panel">Loading selected market timeframe...</div>}

      <section className="mode-toolbar" aria-label="Data mode and language">
        <DataModeToggle mode={providerName} language={language} onChange={changeProviderMode} />
        <LanguageToggle language={language} onChange={setLanguage} />
      </section>

      {providerName === "backend" && error && (
        <div className="status-panel status-panel--error">
          {t("backendUnavailable", language)}
          <button className="secondary-action" onClick={() => changeProviderMode("mock")} type="button">
            {t("backToSimulation", language)}
          </button>
        </div>
      )}

      <ModelControlPanel
        state={controlState}
        error={controlError || providerWarning}
        providerName={provider.name}
        providerMode={providerName}
        language={language}
        onChange={setControlState}
        onRunAnalysis={runAnalysis}
        onResetDefaults={resetDefaults}
        onApplyPreset={applyPreset}
        onSelectTicker={selectTickerFromSearch}
        onClearSelectedTicker={providerName === "backend" ? clearSelectedTicker : undefined}
      />

      <DataSourceBadges dataSource={activeDataSource} language={language} />

      {!data && (
        <section className="empty-ticker-state" aria-label="Ticker search empty state">
          <p className="terminal-label">{t("realAlpaca", language)}</p>
          <h2>{t("searchToBegin", language)}</h2>
          <span>{t("alpacaSupportedSymbolsNote", language)}</span>
        </section>
      )}

      <WatchlistManager
        activeTickers={activeUniverseTickers}
        providerName={providerName}
        language={language}
        isLoading={isScreenerLoading}
        onApply={applyWatchlist}
        onReset={resetWatchlist}
      />

      <MultiTickerScreener
        rows={screenerRows}
        selectedTicker={selectedTicker}
        providerName={providerName}
        language={language}
        skippedTickers={screenerErrors}
        isLoading={isScreenerLoading}
        onOpen={openTicker}
        onTrackSignal={trackSignal}
      />

      <PerformanceSummaryPanel summary={performanceSummary} language={language} />

      <AutoEvaluationControls
        rule={autoEvaluationRule}
        language={language}
        results={autoEvaluationResults}
        errors={evaluationErrors}
        isEvaluating={isEvaluatingSignals}
        openSignalsCount={openSignalsCount}
        error={autoEvaluationError}
        onRuleChange={setAutoEvaluationRule}
        onEvaluate={autoEvaluateOpenSignals}
      />

      <SignalHistoryPanel
        signals={signalHistory}
        language={language}
        evaluations={signalEvaluations}
        autoEvaluationResults={autoEvaluationResults}
        evaluationErrors={evaluationErrors}
        isEvaluating={isEvaluatingSignals}
        onEvaluateOpenSignals={evaluateSignals}
        onClose={closeSignal}
        onCloseAtCurrentPrice={closeSignalAtCurrentPrice}
        onArchive={archiveSignal}
        onDelete={deleteSignal}
        onClear={clearSignals}
      />

      <HistoryBackupPanel
        signalHistory={signalHistory}
        language={language}
        performanceSummary={performanceSummary}
        autoEvaluationRule={autoEvaluationRule}
        onImportSignals={importSignalHistory}
      />

      {data ? (
        <>
          <div className="dashboard-grid">
            <ProjectionChart
              historicalPath={data.historicalPath}
              projectedPath={data.projectedPath}
              expectedMove={data.expectedMove}
              levels={data.levels}
              ticker={data.ticker}
              dataSource={data.dataSource}
              selectedTimeframe={selectedTimeframe}
              activeView={activeView}
              marketTimeframe={data.marketTimeframe}
              useLocalTimeframeFilter={providerName === "mock"}
            />

            <aside className="side-panel" aria-label="Projection details">
              <section className="projection-head">
                <p className="terminal-label">
                  <InfoTooltip termKey="projectionHead" compact />
                </p>
                <strong>{data.projectionHead}</strong>
                <span>{data.projectionDescription}</span>
              </section>

              {activeView === "projections" ? (
                <>
                  <ScenarioPanel scenarios={data.scenarios} />
                  <ExpectedMovePanel expectedMove={data.expectedMove} />
                </>
              ) : (
                <section className="side-section">
                  <h3>Support / Resistance Focus</h3>
                  <dl className="metric-list">
                    <div>
                      <dt>
                        <InfoTooltip termKey="support" compact />
                      </dt>
                      <dd>{data.levels.support}</dd>
                    </div>
                    <div>
                      <dt>
                        <InfoTooltip termKey="resistance" compact />
                      </dt>
                      <dd>{data.levels.resistance}</dd>
                    </div>
                    <div>
                      <dt>
                        <InfoTooltip termKey="putWall" compact />
                      </dt>
                      <dd>{data.levels.support}</dd>
                    </div>
                    <div>
                      <dt>
                        <InfoTooltip termKey="callWall" compact />
                      </dt>
                      <dd>{data.levels.resistance}</dd>
                    </div>
                    <div>
                      <dt>
                        <InfoTooltip termKey="maxPain" compact />
                      </dt>
                      <dd>{data.levels.maxPain}</dd>
                    </div>
                  </dl>
                </section>
              )}
              <TradeReadPanel tradeRead={data.tradeRead} dataSource={data.dataSource} language={language} />
            </aside>
          </div>

          <section className="audit-section" aria-label="Options engine audit">
            <div className="audit-title-row">
              <div>
                <p className="terminal-label">Options engine transparency</p>
                <h2>{dataSourceCopy.auditTitle}</h2>
              </div>
              <DataSourceBadges dataSource={data.dataSource} compact language={language} />
            </div>

            <div className="audit-grid">
              <DiagnosticsPanel diagnostics={data.diagnostics} />
              <StrikeConcentrationPanel concentrations={data.diagnostics.strikeConcentration} levels={data.levels} />
              <OptionChainPanel rows={data.optionChainRows} />
            </div>
          </section>
        </>
      ) : null}

      <GlossaryPanel language={language} />

      <p className="disclaimer">{dataSourceCopy.footerText}</p>
    </main>
  );
}

export default App;

function applyConfigToRawData(rawData: RawOptionProjectionInput, modelConfig: ModelConfig): RawOptionProjectionInput {
  return {
    ...rawData,
    selectedDteRange: [modelConfig.preferredDteMin, modelConfig.preferredDteMax],
    modelConfig,
  };
}

function getEnvProviderName(): ProviderName {
  const configuredProvider = import.meta.env.VITE_DATA_PROVIDER;

  if (configuredProvider === "mock" || configuredProvider === "backend") {
    return configuredProvider;
  }

  if (configuredProvider) {
    console.warn(`Unknown VITE_DATA_PROVIDER "${configuredProvider}". Falling back to mock.`);
  }

  return "mock";
}

function getStoredProviderName(): ProviderName {
  try {
    const storedProvider = window.localStorage.getItem(dataProviderModeStorageKey);

    if (storedProvider === "mock" || storedProvider === "backend") {
      return storedProvider;
    }
  } catch {
    return getEnvProviderName();
  }

  return getEnvProviderName();
}

function saveProviderName(nextProviderName: ProviderName) {
  try {
    window.localStorage.setItem(dataProviderModeStorageKey, nextProviderName);
  } catch {
    // Provider mode persistence is optional; in-memory mode still works.
  }
}

function getStoredLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);

    if (storedLanguage === "es" || storedLanguage === "en") {
      return storedLanguage;
    }
  } catch {
    return "es";
  }

  return "es";
}

function saveLanguage(language: Language) {
  try {
    window.localStorage.setItem(languageStorageKey, language);
  } catch {
    // Language persistence is optional; in-memory language still works.
  }
}

function getLastTicker(): string {
  try {
    const ticker = window.localStorage.getItem(lastTickerStorageKey)?.trim().toUpperCase() ?? "";

    return /^[A-Z0-9.-]{1,10}$/.test(ticker) ? ticker : "";
  } catch {
    return "";
  }
}

function saveLastTicker(ticker: string) {
  try {
    window.localStorage.setItem(lastTickerStorageKey, ticker.trim().toUpperCase());
  } catch {
    // Last ticker persistence is optional; current session still works.
  }
}

function clearLastTicker() {
  try {
    window.localStorage.removeItem(lastTickerStorageKey);
  } catch {
    // Last ticker persistence is optional; current session still works.
  }
}

function getEmptyHeaderSnapshot(): HeaderSnapshot {
  return {
    agentName: "AI Option Agent",
    ticker: "-",
    price: 0,
    percentChange: 0,
    lastCandleDate: "-",
    formattedPrice: "-",
    formattedChange: "-",
    formattedLastCandleDate: "-",
    timeframes: [
      { label: "5D / 5M", range: "5D", interval: "5M" },
      { label: "30D / 30M", range: "30D", interval: "30M" },
      { label: "3M / 1D", range: "3M", interval: "1D" },
    ],
    layers: ["Projections", "Support / Resistance"],
  };
}

function getEmptyDataSource(activeProviderName: ProviderName): DataSourceStatus {
  return {
    marketData: activeProviderName === "backend" ? "real" : "mock",
    marketDataProvider: activeProviderName === "backend" ? "alpaca" : "mock",
    optionsData: "mock",
    optionsDataProvider: "mock",
    lastUpdated: new Date().toISOString(),
  };
}

function getProviderErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}

function getConfigFromControlState(state: ModelControlState): ModelConfig {
  return {
    minOpenInterest: state.minOpenInterest,
    minVolume: state.minVolume,
    maxBidAskSpreadPercent: state.maxBidAskSpreadPercent,
    maxThetaPercentOfPremium: state.maxThetaPercentOfPremium,
    preferredDteMin: state.preferredDteMin,
    preferredDteMax: state.preferredDteMax,
  };
}

function validateControlState(
  state: ModelControlState,
  activeProviderName: ProviderName,
): string {
  const numericValues = [
    state.minOpenInterest,
    state.minVolume,
    state.maxBidAskSpreadPercent,
    state.maxThetaPercentOfPremium,
    state.preferredDteMin,
    state.preferredDteMax,
  ];

  const ticker = state.ticker.trim().toUpperCase();

  if (!ticker) return "Ticker is required.";
  if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return "Ticker must be 1-10 characters using letters, numbers, dot, or hyphen.";
  }
  if (activeProviderName === "mock" && !defaultMockWatchlist.includes(ticker)) {
    return getTickerNotFoundMessage(activeProviderName);
  }
  if (numericValues.some((value) => !Number.isFinite(value))) return "All numeric filters must be valid numbers.";
  if (state.minOpenInterest < 0) return "Min Open Interest must be 0 or greater.";
  if (state.minVolume < 0) return "Min Volume must be 0 or greater.";
  if (state.maxBidAskSpreadPercent < 0.01 || state.maxBidAskSpreadPercent > 1) {
    return "Max Bid/Ask Spread must be between 1% and 100%.";
  }
  if (state.maxThetaPercentOfPremium < 0.01 || state.maxThetaPercentOfPremium > 1) {
    return "Max Theta must be between 1% and 100%.";
  }
  if (state.preferredDteMin < 0) return "Preferred DTE Min must be 0 or greater.";
  if (state.preferredDteMax <= state.preferredDteMin) return "Preferred DTE Max must be greater than DTE Min.";

  return "";
}

function getTickerNotFoundMessage(activeProviderName: ProviderName): string {
  return activeProviderName === "backend"
    ? "Ticker not found by Alpaca or no market data available."
    : "Mock Mode only supports MU, AMD, NVDA, TSLA, AAPL and HOOD. Switch to Backend Mode to load real Alpaca tickers.";
}

function getDefaultWatchlist(activeProviderName: ProviderName): string[] {
  return activeProviderName === "backend" ? defaultBackendWatchlist : defaultMockWatchlist;
}

function getInitialWatchlist(activeProviderName: ProviderName): string[] {
  const saved = readSavedWatchlist();

  return saved.length > 0 ? saved : getDefaultWatchlist(activeProviderName);
}

function readSavedWatchlist(): string[] {
  try {
    const value = window.localStorage.getItem(watchlistStorageKey);
    const parsed = value ? JSON.parse(value) : null;

    if (Array.isArray(parsed)) {
      return parsed.filter((ticker): ticker is string => typeof ticker === "string").slice(0, 25);
    }
  } catch {
    return [];
  }

  return [];
}

function saveWatchlist(tickers: string[]) {
  try {
    window.localStorage.setItem(watchlistStorageKey, JSON.stringify(tickers));
  } catch {
    // Local persistence is optional; the active in-memory watchlist still works.
  }
}

function clearSavedWatchlist() {
  try {
    window.localStorage.removeItem(watchlistStorageKey);
  } catch {
    // Local persistence is optional; reset still works in memory.
  }
}

function getStoredAutoEvaluationRule(): Required<AutoEvaluationRule> {
  try {
    const storedValue = window.localStorage.getItem(autoEvaluationRuleStorageKey);
    const parsed = storedValue ? (JSON.parse(storedValue) as Partial<AutoEvaluationRule>) : null;

    return normalizeAutoEvaluationRule(parsed ?? {});
  } catch {
    return defaultAutoEvaluationRule;
  }
}

function saveAutoEvaluationRule(rule: Required<AutoEvaluationRule>) {
  try {
    window.localStorage.setItem(autoEvaluationRuleStorageKey, JSON.stringify(rule));
  } catch {
    // Rule persistence is optional; the active in-memory rule still works.
  }
}

function normalizeAutoEvaluationRule(rule: Partial<AutoEvaluationRule>): Required<AutoEvaluationRule> {
  return {
    ...defaultAutoEvaluationRule,
    ...rule,
  };
}

function validateAutoEvaluationRule(rule: Required<AutoEvaluationRule>): string {
  if (!Number.isFinite(rule.targetPercent) || rule.targetPercent <= 0) return "Target % must be greater than 0.";
  if (!Number.isFinite(rule.stopPercent) || rule.stopPercent <= 0) return "Stop % must be greater than 0.";
  if (!Number.isFinite(rule.maxBarsForward) || rule.maxBarsForward < 1 || rule.maxBarsForward > 500) {
    return "Max bars forward must be between 1 and 500.";
  }
  if (!Number.isFinite(rule.neutralMaxBreakPercent) || rule.neutralMaxBreakPercent <= 0) {
    return "Neutral break % must be greater than 0.";
  }

  return "";
}

function appendAutoEvaluationNote(existingNote: string | undefined, reason: string): string {
  const autoNote = `Auto: ${reason}`;

  if (!existingNote) return autoNote;
  if (existingNote.includes(autoNote)) return existingNote;

  return `${existingNote} | ${autoNote}`;
}
