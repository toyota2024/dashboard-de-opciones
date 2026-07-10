export type Language = "es" | "en";

type DictionaryKey =
  | "dataMode"
  | "simulation"
  | "realAlpaca"
  | "language"
  | "spanish"
  | "english"
  | "realAlpacaDescription"
  | "simulationDescription"
  | "backendUnavailable"
  | "backToSimulation"
  | "providerBackendActive"
  | "providerMockActive"
  | "optionsProjectionConsole"
  | "ticker"
  | "price"
  | "change"
  | "lastCandle"
  | "projections"
  | "supportResistance"
  | "analysisFilters"
  | "modelControl"
  | "conservative"
  | "balanced"
  | "aggressive"
  | "runAnalysis"
  | "resetDefaults"
  | "currentFilters"
  | "dataProvider"
  | "market"
  | "options"
  | "lastUpdated"
  | "mock"
  | "real"
  | "simulationMode"
  | "hybridMode"
  | "mockWarning"
  | "hybridWarning"
  | "optionsIncomplete"
  | "watchlistUniverse"
  | "customScreenerUniverse"
  | "applyWatchlist"
  | "resetDefault"
  | "activeTickers"
  | "validMax"
  | "mockWatchlistNote"
  | "backendWatchlistNote"
  | "optionsScreener"
  | "searchTicker"
  | "sortBy"
  | "direction"
  | "status"
  | "bias"
  | "minimumScore"
  | "minAccepted"
  | "maxRejection"
  | "showingTickers"
  | "score"
  | "grade"
  | "trackSignal"
  | "open"
  | "openAction"
  | "performanceSummary"
  | "totalSignals"
  | "closed"
  | "archived"
  | "wins"
  | "losses"
  | "breakevens"
  | "winRate"
  | "avgReturn"
  | "bestReturn"
  | "worstReturn"
  | "cumulativeReturn"
  | "maxDrawdown"
  | "autoEvaluationRules"
  | "autoEvaluationResults"
  | "signalHistory"
  | "clearHistory"
  | "evaluateOpenSignals"
  | "noTrackedSignals"
  | "historyBackup"
  | "searchTickerOrCompany"
  | "examplesTickerSearch"
  | "noLocalMatchTryAlpaca"
  | "simulationOnlyDemoTickers"
  | "searchToBegin"
  | "alpacaSupportedSymbolsNote"
  | "clearSelectedTicker"
  | "demoTicker"
  | "watchlistTickerOnlyNote"
  | "stock"
  | "etf"
  | "activeMode"
  | "active"
  | "backendSimpleSummary"
  | "mockSimpleSummary"
  | "backendDataSummary"
  | "mockDataSummary"
  | "minOpenInterest"
  | "minVolume"
  | "maxBidAskSpread"
  | "maxThetaPremium"
  | "preferredDteMin"
  | "preferredDteMax"
  | "localPerformanceEngine"
  | "ruleBasedSignalTesting"
  | "localSignalJournal"
  | "localDataProtection"
  | "technicalTerms"
  | "scannerLimited"
  | "screenerDataNote"
  | "screenerScoreNote"
  | "performanceEmpty"
  | "performanceDisclaimer"
  | "autoEvaluationDescription"
  | "autoEvaluationDisclaimer"
  | "autoEvaluationApproximation"
  | "noOpenSignalsToEvaluate"
  | "trackedSignalsDescription"
  | "trackedSignalsDisclaimer"
  | "backupDescription"
  | "backupDisclaimer"
  | "exportSignalsJson"
  | "exportSignalsCsv"
  | "exportPerformanceCsv"
  | "exportFullBackupJson"
  | "importBackupJson"
  | "exportAutoRuleJson"
  | "targetMode"
  | "stopMode"
  | "targetPercent"
  | "stopPercent"
  | "maxBarsForward"
  | "neutralBreakPercent"
  | "autoEvaluateOpenSignals"
  | "projectionHead"
  | "support"
  | "all"
  | "win"
  | "loss"
  | "breakeven"
  | "noTickerMatches";

const dictionary: Record<Language, Record<DictionaryKey, string>> = {
  es: {
    dataMode: "Modo de datos",
    simulation: "Simulacion",
    realAlpaca: "Real / Alpaca",
    language: "Idioma",
    spanish: "Espanol",
    english: "English",
    realAlpacaDescription: "Real / Alpaca usa velas y precios reales. Los niveles de opciones siguen simulados.",
    simulationDescription: "Modo simulacion activo. Solo usa tickers de demostracion.",
    backendUnavailable: "No se pudo conectar con el backend. Abre el launcher o inicia el servidor local.",
    backToSimulation: "Volver a Simulacion",
    providerBackendActive: "Modo Real / Alpaca activo. Los datos de mercado se cargan desde Alpaca cuando estan disponibles.",
    providerMockActive: "Modo Simulacion activo. Solo usa tickers de demostracion.",
    optionsProjectionConsole: "Consola de proyeccion de opciones",
    ticker: "Ticker",
    price: "Precio",
    change: "Cambio",
    lastCandle: "Ultima vela",
    projections: "Proyecciones",
    supportResistance: "Soporte / Resistencia",
    analysisFilters: "Filtros de analisis",
    modelControl: "Control del modelo",
    conservative: "Conservador",
    balanced: "Balanceado",
    aggressive: "Agresivo",
    runAnalysis: "Ejecutar analisis",
    resetDefaults: "Restaurar defaults",
    currentFilters: "Filtros actuales",
    dataProvider: "Proveedor de datos",
    market: "Mercado",
    options: "Opciones",
    lastUpdated: "Actualizado",
    mock: "Mock",
    real: "Real",
    simulationMode: "Modo simulacion: datos de mercado simulados + motor de opciones simulado.",
    hybridMode: "Modo hibrido: mercado real desde Alpaca + motor de opciones simulado.",
    mockWarning: "Las velas, cadena de opciones, Max Pain, walls y probabilidades son simuladas.",
    hybridWarning: "Las velas y precios vienen de Alpaca. La cadena de opciones, Max Pain, Call Wall, Put Wall y probabilidades siguen simuladas.",
    optionsIncomplete: "Alpaca detecto contratos reales de opciones, pero faltan campos clave. El dashboard seguira usando niveles de opciones simulados hasta que la calidad sea suficiente.",
    watchlistUniverse: "Universo de watchlist",
    customScreenerUniverse: "Universo personalizado del screener",
    applyWatchlist: "Aplicar watchlist",
    resetDefault: "Restaurar default",
    activeTickers: "tickers activos",
    validMax: "validos / max",
    mockWatchlistNote: "Modo Simulacion solo escanea tickers demo. Cambia a Real / Alpaca para escanear tickers soportados por Alpaca.",
    backendWatchlistNote: "Modo Real / Alpaca puede escanear tickers soportados por Alpaca. Los resultados dependen de esta watchlist.",
    optionsScreener: "Screener de opciones",
    searchTicker: "Buscar ticker",
    sortBy: "Ordenar por",
    direction: "Direccion",
    status: "Estado",
    bias: "Sesgo",
    minimumScore: "Score minimo",
    minAccepted: "Min aceptados",
    maxRejection: "Max rechazo",
    showingTickers: "Mostrando {visible} de {total} tickers",
    score: "Score",
    grade: "Grado",
    trackSignal: "Guardar senal",
    open: "Abiertas",
    openAction: "Abrir",
    performanceSummary: "Resumen de performance",
    totalSignals: "Senales totales",
    closed: "Cerradas",
    archived: "Archivadas",
    wins: "Ganadas",
    losses: "Perdidas",
    breakevens: "Empates",
    winRate: "Win rate",
    avgReturn: "Retorno prom.",
    bestReturn: "Mejor retorno",
    worstReturn: "Peor retorno",
    cumulativeReturn: "Retorno acumulado",
    maxDrawdown: "Max drawdown",
    autoEvaluationRules: "Reglas de autoevaluacion",
    autoEvaluationResults: "Resultados de autoevaluacion",
    signalHistory: "Historial de senales",
    clearHistory: "Limpiar historial",
    evaluateOpenSignals: "Evaluar senales abiertas",
    noTrackedSignals: "Todavia no hay senales guardadas.",
    historyBackup: "Backup del historial",
    searchTickerOrCompany: "Busca ticker o nombre de compania...",
    examplesTickerSearch: "Ejemplos: Microsoft, Meta, SPY, NVDA",
    noLocalMatchTryAlpaca: "No hay coincidencia local. Presiona Enter para intentar cargar este ticker desde Alpaca.",
    simulationOnlyDemoTickers: "Modo Simulacion solo acepta tickers demo.",
    searchToBegin: "Busca un ticker o nombre de compania para comenzar.",
    alpacaSupportedSymbolsNote: "Modo Real / Alpaca puede cargar simbolos soportados por Alpaca. Los niveles de opciones siguen simulados.",
    clearSelectedTicker: "Limpiar ticker seleccionado",
    demoTicker: "Ticker demo",
    watchlistTickerOnlyNote: "La watchlist usa simbolos de ticker. La busqueda por nombre esta disponible en el analisis individual.",
    stock: "Accion",
    etf: "ETF",
    activeMode: "Modo activo",
    active: "Activo",
    backendSimpleSummary: "Precios y velas: reales. Opciones: simuladas.",
    mockSimpleSummary: "Todo esta en simulacion. Usa este modo para pruebas.",
    backendDataSummary: "Precios y velas reales desde Alpaca. Opciones simuladas.",
    mockDataSummary: "Datos simulados para pruebas. No usar para analisis real.",
    minOpenInterest: "Interes abierto minimo",
    minVolume: "Volumen minimo",
    maxBidAskSpread: "Spread Bid/Ask maximo %",
    maxThetaPremium: "Theta maximo % de prima",
    preferredDteMin: "DTE minimo preferido",
    preferredDteMax: "DTE maximo preferido",
    localPerformanceEngine: "Motor local de performance",
    ruleBasedSignalTesting: "Prueba de senales por reglas",
    localSignalJournal: "Diario local de senales",
    localDataProtection: "Proteccion de datos local",
    technicalTerms: "Terminos tecnicos",
    scannerLimited: "El universo del screener es limitado. La busqueda manual puede cargar cualquier simbolo soportado por Alpaca.",
    screenerDataNote: "El screener usa velas reales de Alpaca cuando el modo Real esta activo. Los niveles de opciones siguen simulados hasta que la calidad de datos sea suficiente.",
    screenerScoreNote: "El score del screener sirve para priorizar revision. No es una senal de compra o venta.",
    performanceEmpty: "Las metricas apareceran despues de cerrar senales.",
    performanceDisclaimer: "El performance se basa en senales guardadas y salidas manuales o basadas en mercado. No es P/L real de broker.",
    autoEvaluationDescription: "Evalua senales locales abiertas contra velas posteriores usando targets y stops virtuales.",
    autoEvaluationDisclaimer: "La autoevaluacion usa velas historicas posteriores a la senal. Es una evaluacion del modelo, no una ejecucion de trade.",
    autoEvaluationApproximation: "La autoevaluacion es una aproximacion tipo backtest basada en reglas. Puede diferir del P/L real de una operacion de opciones.",
    noOpenSignalsToEvaluate: "No hay senales abiertas para evaluar.",
    trackedSignalsDescription: "Snapshots del screener guardados con evaluacion local de performance.",
    trackedSignalsDisclaimer: "Las senales se guardan localmente en este navegador. No son operaciones reales ni asesoria financiera.",
    backupDescription: "Exporta, importa y respalda el historial local de senales, metricas de performance y reglas de autoevaluacion.",
    backupDisclaimer: "Las exportaciones se guardan localmente desde este navegador. Pueden incluir tus tickers, notas de senales y resultados de performance. No se envia informacion al servidor.",
    exportSignalsJson: "Exportar historial JSON",
    exportSignalsCsv: "Exportar historial CSV",
    exportPerformanceCsv: "Exportar performance CSV",
    exportFullBackupJson: "Exportar backup completo",
    importBackupJson: "Importar backup",
    exportAutoRuleJson: "Exportar regla de autoevaluacion",
    targetMode: "Modo target",
    stopMode: "Modo stop",
    targetPercent: "Target %",
    stopPercent: "Stop %",
    maxBarsForward: "Max. velas hacia adelante",
    neutralBreakPercent: "Ruptura neutral %",
    autoEvaluateOpenSignals: "Autoevaluar senales abiertas",
    projectionHead: "Cabeza de proyeccion",
    support: "Soporte",
    all: "Todos",
    win: "Ganada",
    loss: "Perdida",
    breakeven: "Empate",
    noTickerMatches: "No hay tickers que coincidan con los filtros.",
  },
  en: {
    dataMode: "Data Mode",
    simulation: "Simulation",
    realAlpaca: "Real / Alpaca",
    language: "Language",
    spanish: "Espanol",
    english: "English",
    realAlpacaDescription: "Real / Alpaca uses real candles and prices. Options levels are still simulated.",
    simulationDescription: "Simulation Mode is active. This mode only supports demo tickers.",
    backendUnavailable: "Could not connect to backend. Open the launcher or start the local server.",
    backToSimulation: "Back to Simulation",
    providerBackendActive: "Backend Mode is active. Market data is loaded from Alpaca when available.",
    providerMockActive: "Mock Mode is active. This mode only supports demo tickers.",
    optionsProjectionConsole: "Options projection console",
    ticker: "Ticker",
    price: "Price",
    change: "Change",
    lastCandle: "Last candle",
    projections: "Projections",
    supportResistance: "Support / Resistance",
    analysisFilters: "Analysis Filters",
    modelControl: "Model control",
    conservative: "Conservative",
    balanced: "Balanced",
    aggressive: "Aggressive",
    runAnalysis: "Run Analysis",
    resetDefaults: "Reset Defaults",
    currentFilters: "Current filters",
    dataProvider: "Data Provider",
    market: "Market",
    options: "Options",
    lastUpdated: "Last updated",
    mock: "Mock",
    real: "Real",
    simulationMode: "Simulation Mode: Mock Market Data + Mock Options Engine",
    hybridMode: "Hybrid Mode: Real Market Data + Mock Options Engine",
    mockWarning: "Market candles, option chain, max pain, walls and scenario probabilities are simulated.",
    hybridWarning: "Market candles are real from Alpaca. Option chain, max pain, walls and scenario probabilities are still simulated.",
    optionsIncomplete: "Real options contracts were detected from Alpaca, but key fields are incomplete. The dashboard continues using simulated options levels until options data quality is sufficient.",
    watchlistUniverse: "Watchlist Universe",
    customScreenerUniverse: "Custom Screener Universe",
    applyWatchlist: "Apply Watchlist",
    resetDefault: "Reset Default",
    activeTickers: "active tickers",
    validMax: "valid / max",
    mockWatchlistNote: "Mock Mode only scans demo tickers. Switch to Backend Mode to scan Alpaca-supported tickers.",
    backendWatchlistNote: "Backend Mode can scan Alpaca-supported tickers. Screener results depend on this watchlist.",
    optionsScreener: "Options Screener",
    searchTicker: "Search ticker",
    sortBy: "Sort by",
    direction: "Direction",
    status: "Status",
    bias: "Bias",
    minimumScore: "Minimum Score",
    minAccepted: "Min Accepted",
    maxRejection: "Max Rejection",
    showingTickers: "Showing {visible} of {total} tickers",
    score: "Score",
    grade: "Grade",
    trackSignal: "Track Signal",
    open: "Open",
    openAction: "Open",
    performanceSummary: "Performance Summary",
    totalSignals: "Total signals",
    closed: "Closed",
    archived: "Archived",
    wins: "Wins",
    losses: "Losses",
    breakevens: "Breakevens",
    winRate: "Win Rate",
    avgReturn: "Avg Return",
    bestReturn: "Best Return",
    worstReturn: "Worst Return",
    cumulativeReturn: "Cumulative Return",
    maxDrawdown: "Max Drawdown",
    autoEvaluationRules: "Auto Evaluation Rules",
    autoEvaluationResults: "Auto Evaluation Results",
    signalHistory: "Signal History",
    clearHistory: "Clear History",
    evaluateOpenSignals: "Evaluate Open Signals",
    noTrackedSignals: "No tracked signals yet.",
    historyBackup: "History Backup",
    searchTickerOrCompany: "Search ticker or company name...",
    examplesTickerSearch: "Try: Microsoft, Meta, SPY, NVDA",
    noLocalMatchTryAlpaca: "No local match. Press Enter to try this ticker with Alpaca.",
    simulationOnlyDemoTickers: "Simulation mode only supports demo tickers.",
    searchToBegin: "Search a ticker or company name to begin.",
    alpacaSupportedSymbolsNote: "Real / Alpaca mode can load Alpaca-supported symbols. Options levels remain simulated.",
    clearSelectedTicker: "Clear selected ticker",
    demoTicker: "Demo ticker",
    watchlistTickerOnlyNote: "Watchlist uses ticker symbols. Company-name search is available in individual analysis.",
    stock: "Stock",
    etf: "ETF",
    activeMode: "Active mode",
    active: "Active",
    backendSimpleSummary: "Prices and candles: real. Options: simulated.",
    mockSimpleSummary: "Everything is simulated. Use this mode for testing.",
    backendDataSummary: "Real prices and candles from Alpaca. Simulated options.",
    mockDataSummary: "Simulated data for testing. Do not use for real analysis.",
    minOpenInterest: "Min Open Interest",
    minVolume: "Min Volume",
    maxBidAskSpread: "Max Bid/Ask Spread %",
    maxThetaPremium: "Max Theta % of Premium",
    preferredDteMin: "Preferred DTE Min",
    preferredDteMax: "Preferred DTE Max",
    localPerformanceEngine: "Local performance engine",
    ruleBasedSignalTesting: "Rule-based signal testing",
    localSignalJournal: "Local signal journal",
    localDataProtection: "Local data protection",
    technicalTerms: "Technical terms",
    scannerLimited: "Scanner universe is limited. Manual ticker search can load any Alpaca-supported symbol.",
    screenerDataNote: "Screener uses real Alpaca market candles when backend mode is active. Options levels remain simulated until options data quality is sufficient.",
    screenerScoreNote: "Screener score is a prioritization model, not a buy/sell signal.",
    performanceEmpty: "Performance metrics will appear after signals are closed.",
    performanceDisclaimer: "Performance is based on tracked screener snapshots and manual/market-based exits. It is not brokerage P/L.",
    autoEvaluationDescription: "Evaluate open local signals against later candles with virtual targets and stops.",
    autoEvaluationDisclaimer: "Auto evaluation uses historical candles after the tracked signal timestamp. It is a model evaluation, not a trade execution.",
    autoEvaluationApproximation: "Auto evaluation is a rule-based backtest-style approximation. It may differ from real option trade P/L.",
    noOpenSignalsToEvaluate: "No open signals to evaluate.",
    trackedSignalsDescription: "Tracked screener snapshots with local performance evaluation.",
    trackedSignalsDisclaimer: "Tracked signals are saved locally in this browser. They are not trades and do not represent financial advice.",
    backupDescription: "Export, import and back up local signal history, performance metrics and auto evaluation rules.",
    backupDisclaimer: "Exports are saved locally from this browser. They may include your tracked tickers, signal notes and performance results. No data is sent to a server.",
    exportSignalsJson: "Export Signal History JSON",
    exportSignalsCsv: "Export Signal History CSV",
    exportPerformanceCsv: "Export Performance CSV",
    exportFullBackupJson: "Export Full Backup JSON",
    importBackupJson: "Import Backup JSON",
    exportAutoRuleJson: "Export Auto Evaluation Rule JSON",
    targetMode: "Target mode",
    stopMode: "Stop mode",
    targetPercent: "Target %",
    stopPercent: "Stop %",
    maxBarsForward: "Max bars forward",
    neutralBreakPercent: "Neutral break %",
    autoEvaluateOpenSignals: "Auto Evaluate Open Signals",
    projectionHead: "Projection Head",
    support: "Support",
    all: "All",
    win: "Win",
    loss: "Loss",
    breakeven: "Breakeven",
    noTickerMatches: "No tickers match the current filters.",
  },
};

export function t(key: DictionaryKey, language: Language, params?: Record<string, string | number>): string {
  let value = dictionary[language][key] ?? dictionary.en[key] ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.split(`{${paramKey}}`).join(String(paramValue));
    }
  }

  return value;
}
