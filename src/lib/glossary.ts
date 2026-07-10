export type GlossaryCategory = "market" | "options" | "risk" | "model" | "filters";

export type GlossaryTerm = {
  key: string;
  label: string;
  short: string;
  long: string;
  category: GlossaryCategory;
};

export const glossary = {
  spot: {
    key: "spot",
    label: "Spot",
    short: "Precio actual o de referencia del activo.",
    long: "Es el precio base desde donde se comparan soportes, resistencias, strikes y rangos esperados.",
    category: "market",
  },
  support: {
    key: "support",
    label: "Support",
    short: "Zona donde el precio podria encontrar demanda.",
    long: "En este dashboard se deriva de niveles de opciones simulados. No confirma compra por si sola.",
    category: "market",
  },
  resistance: {
    key: "resistance",
    label: "Resistance",
    short: "Zona donde el precio podria encontrar oferta.",
    long: "En este dashboard se usa como referencia visual de presion por arriba del precio actual.",
    category: "market",
  },
  callWall: {
    key: "callWall",
    label: "Call Wall",
    short: "Strike con mucha concentracion de calls.",
    long: "Puede actuar como resistencia teorica porque hay mucho interes abierto o volumen en calls en ese nivel.",
    category: "options",
  },
  putWall: {
    key: "putWall",
    label: "Put Wall",
    short: "Strike con mucha concentracion de puts.",
    long: "Puede actuar como soporte teorico porque hay mucho interes abierto o volumen en puts en ese nivel.",
    category: "options",
  },
  maxPain: {
    key: "maxPain",
    label: "Max Pain",
    short: "Nivel teorico donde muchas opciones perderian valor al vencimiento.",
    long: "No es una senal de entrada por si sola. Sirve como referencia de presion o zona magnetica, especialmente cerca del vencimiento.",
    category: "options",
  },
  expectedMove: {
    key: "expectedMove",
    label: "Expected Move",
    short: "Rango estimado de movimiento segun volatilidad.",
    long: "Ayuda a visualizar cuanto podria moverse el precio dentro de un periodo. Aqui depende del motor de opciones simulado.",
    category: "risk",
  },
  oneSigma: {
    key: "oneSigma",
    label: "1σ",
    short: "Rango base esperado con una desviacion estandar.",
    long: "Representa un rango probabilistico normalizado. No garantiza que el precio se mantenga dentro del cono.",
    category: "risk",
  },
  twoSigma: {
    key: "twoSigma",
    label: "2σ",
    short: "Rango amplio de estres con dos desviaciones estandar.",
    long: "Se usa para visualizar escenarios mas extremos y controlar riesgo de movimientos grandes.",
    category: "risk",
  },
  iv: {
    key: "iv",
    label: "IV",
    short: "Volatilidad implicita esperada por el mercado de opciones.",
    long: "Una IV alta suele indicar primas mas caras y mayor expectativa de movimiento. En modo mock se calcula desde datos simulados.",
    category: "options",
  },
  theta: {
    key: "theta",
    label: "Theta",
    short: "Perdida aproximada de valor por paso del tiempo.",
    long: "En opciones, theta es el costo diario del tiempo. Si theta es alto, la opcion puede perder valor aunque el precio no se mueva.",
    category: "risk",
  },
  dte: {
    key: "dte",
    label: "DTE",
    short: "Dias que faltan para el vencimiento.",
    long: "Un DTE bajo significa que la opcion vence pronto y suele tener mas riesgo de theta. Un DTE mas alto da mas tiempo, pero puede costar mas.",
    category: "options",
  },
  openInterest: {
    key: "openInterest",
    label: "Open Interest",
    short: "Contratos abiertos que siguen activos.",
    long: "Mide cuantas posiciones de opciones permanecen abiertas. Ayuda a detectar concentraciones por strike.",
    category: "options",
  },
  volume: {
    key: "volume",
    label: "Volume",
    short: "Contratos negociados durante el periodo.",
    long: "El volumen muestra actividad reciente. Puede confirmar si un strike esta recibiendo atencion nueva.",
    category: "market",
  },
  bid: {
    key: "bid",
    label: "Bid",
    short: "Precio al que compradores intentan comprar.",
    long: "Es la mejor oferta compradora visible. En opciones iliquidas puede estar lejos del ask.",
    category: "options",
  },
  ask: {
    key: "ask",
    label: "Ask",
    short: "Precio al que vendedores intentan vender.",
    long: "Es la mejor oferta vendedora visible. Un ask muy lejano al bid indica poca liquidez.",
    category: "options",
  },
  mid: {
    key: "mid",
    label: "Mid",
    short: "Punto medio entre bid y ask.",
    long: "Sirve como referencia rapida de precio teorico negociable, aunque no garantiza ejecucion.",
    category: "options",
  },
  bidAskSpread: {
    key: "bidAskSpread",
    label: "Bid/Ask Spread",
    short: "Distancia entre el precio comprador y vendedor.",
    long: "Un spread amplio suele indicar menor liquidez y mas costo de entrada o salida.",
    category: "filters",
  },
  delta: {
    key: "delta",
    label: "Delta",
    short: "Sensibilidad de la opcion al movimiento del subyacente.",
    long: "Aproxima cuanto cambia la opcion si la accion se mueve un punto. Tambien se usa como referencia de exposicion direccional.",
    category: "options",
  },
  gamma: {
    key: "gamma",
    label: "Gamma",
    short: "Cambio del delta cuando se mueve el subyacente.",
    long: "Gamma muestra que tan rapido cambia la exposicion direccional. Puede ser relevante cerca del vencimiento.",
    category: "risk",
  },
  vega: {
    key: "vega",
    label: "Vega",
    short: "Sensibilidad de la opcion a cambios en IV.",
    long: "Si vega es alto, cambios en volatilidad implicita pueden mover bastante el precio de la opcion.",
    category: "risk",
  },
  scenarioProbabilities: {
    key: "scenarioProbabilities",
    label: "Scenario Probabilities",
    short: "Probabilidades estimadas para escenarios bullish, neutral y bearish.",
    long: "Son heuristicas del modelo para leer presion de opciones. No son predicciones garantizadas ni senales de trading.",
    category: "model",
  },
  projectionHead: {
    key: "projectionHead",
    label: "Projection Head",
    short: "Punto central de la ruta proyectada.",
    long: "Resume el camino base estimado por el modelo. En modo mock depende de datos simulados de opciones.",
    category: "model",
  },
  filteredContracts: {
    key: "filteredContracts",
    label: "Filtered contracts",
    short: "Contratos que pasaron los filtros de calidad.",
    long: "El motor descarta contratos con baja liquidez, spreads amplios, theta alto o DTE fuera de rango.",
    category: "filters",
  },
  rejectionRate: {
    key: "rejectionRate",
    label: "Rejection rate",
    short: "Porcentaje de contratos descartados.",
    long: "Una tasa alta puede indicar datos pobres, baja liquidez o filtros demasiado estrictos.",
    category: "filters",
  },
  screenerScore: {
    key: "screenerScore",
    label: "Score",
    short: "Puntuacion para priorizar que tickers revisar primero.",
    long: "Combina probabilidades, contratos aceptados, tasa de rechazo, IV y status. No es senal de compra o venta.",
    category: "model",
  },
  screenerGrade: {
    key: "screenerGrade",
    label: "Grade",
    short: "Letra resumida del score: A es mas fuerte, D es mas debil.",
    long: "Sirve para escanear rapido la watchlist. La calidad depende del modo de datos y del motor mock de opciones.",
    category: "model",
  },
  bullish: {
    key: "bullish",
    label: "Bullish",
    short: "Escenario de presion alcista.",
    long: "Sugiere una lectura mas favorable hacia precios superiores, segun el modelo. No es recomendacion de compra.",
    category: "model",
  },
  neutral: {
    key: "neutral",
    label: "Neutral",
    short: "Escenario de rango o reversion a la media.",
    long: "Indica que el modelo no detecta una direccion dominante fuerte.",
    category: "model",
  },
  bearish: {
    key: "bearish",
    label: "Bearish",
    short: "Escenario de presion bajista.",
    long: "Sugiere una lectura mas favorable hacia precios inferiores, segun el modelo. No es recomendacion de venta.",
    category: "model",
  },
} as const satisfies Record<string, GlossaryTerm>;

export type GlossaryKey = keyof typeof glossary;

export const glossaryTerms = Object.values(glossary);

export function getGlossaryTerm(termKey: string): GlossaryTerm | undefined {
  return glossary[termKey as GlossaryKey];
}
