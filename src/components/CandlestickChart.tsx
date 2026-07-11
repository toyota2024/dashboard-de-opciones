import { useEffect, useMemo, useState } from "react";
import {
  getOhlcPriceRange,
  indexToChartX,
  normalizeCandles,
  priceToChartY,
} from "../lib/candlestickScale";
import { formatPrice } from "../lib/formatters";
import { calculateEMA } from "../lib/indicators";
import type { Language } from "../lib/i18n";
import type { ExpectedMove, OptionLevels, PricePoint, SelectedTimeframe } from "../types/options";
import type { NormalizedCandle } from "../lib/candlestickScale";

type CandlestickChartProps = {
  historicalPath: PricePoint[];
  projectedPath: PricePoint[];
  levels: OptionLevels;
  expectedMove: ExpectedMove;
  showProjectionOverlays?: boolean;
  ticker: string;
  selectedTimeframe: SelectedTimeframe;
  marketLabel: string;
  candlesLoaded: number;
  scaleMode?: "price" | "projection";
  language?: Language;
};

type HoverState = {
  index: number;
  x: number;
  y: number;
};

type VisibleRange = {
  startIndex: number;
  endIndex: number;
};

type DragState = {
  startX: number;
  range: VisibleRange;
};

const width = 1120;
const height = 560;
const margin = { top: 8, right: 94, bottom: 10, left: 18 };
const priceHeight = 440;
const volumeTop = 462;
const volumeHeight = 66;
const plotRight = width - margin.right;
const plotClipId = "candlestick-price-plot-clip";

const defaultVisibleCounts: Record<SelectedTimeframe, number> = {
  "1D_1M": 45,
  "5D_15M": 80,
  "3M_4H": 70,
  "1Y_1D": 100,
  "5D_5M": 45,
  "30D_30M": 80,
  "3M_1D": 70,
};

const minVisibleCounts: Record<SelectedTimeframe, number> = {
  "1D_1M": 15,
  "5D_15M": 25,
  "3M_4H": 20,
  "1Y_1D": 30,
  "5D_5M": 15,
  "30D_30M": 25,
  "3M_1D": 20,
};

export function CandlestickChart({
  historicalPath,
  projectedPath,
  levels,
  expectedMove,
  showProjectionOverlays = true,
  ticker,
  selectedTimeframe,
  marketLabel,
  candlesLoaded,
  scaleMode = "price",
  language = "en",
}: CandlestickChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [showEmas, setShowEmas] = useState(false);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>(() => getDefaultVisibleRange(0, selectedTimeframe));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const candles = useMemo(() => normalizeCandles(historicalPath), [historicalPath]);
  const renderRange =
    candles.length > 1 && visibleRange.startIndex === 0 && visibleRange.endIndex === 0
      ? getDefaultVisibleRange(candles.length, selectedTimeframe)
      : visibleRange;
  const clampedRange = clampVisibleRange(renderRange, candles.length);
  const visibleCandles = candles.slice(clampedRange.startIndex, clampedRange.endIndex + 1);
  const visibleProjectedPath = showProjectionOverlays ? projectedPath : [];
  const showFullCone = showProjectionOverlays && scaleMode === "projection";
  const showPriceScaleProjectionPath = showProjectionOverlays && scaleMode === "price";
  const [minPrice, maxPrice] = getOhlcPriceRange(visibleCandles, levels, expectedMove, scaleMode, selectedTimeframe);
  const plotWidth = plotRight - margin.left;
  const lastCandle = visibleCandles[visibleCandles.length - 1];
  const activeIndex = hover?.index ?? Math.max(visibleCandles.length - 1, 0);
  const activeCandle = visibleCandles[activeIndex] ?? lastCandle;
  const maxVolume = Math.max(...visibleCandles.map((candle) => candle.volume), 1);
  const totalSlots = visibleCandles.length + visibleProjectedPath.length;
  const historicalEndIndex = Math.max(visibleCandles.length - 1, 0);
  const closes = visibleCandles.map((candle) => candle.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const xForIndex = (index: number) => margin.left + indexToChartX(index, Math.max(totalSlots, 2), plotWidth);
  const yForPrice = (price: number) => margin.top + (priceToChartY(price, minPrice, maxPrice) / 100) * priceHeight;
  const priceForY = (y: number) => maxPrice - ((y - margin.top) / priceHeight) * (maxPrice - minPrice);
  const projectedPoints = visibleProjectedPath.map((point, index) => ({
    x: xForIndex(visibleCandles.length + index),
    projection: point.projection ?? expectedMove.base,
    expectedLow1: point.expectedLow1 ?? expectedMove.low1Sigma,
    expectedHigh1: point.expectedHigh1 ?? expectedMove.high1Sigma,
    stressLow2: point.stressLow2 ?? expectedMove.stressLow2Sigma,
    stressHigh2: point.stressHigh2 ?? expectedMove.stressHigh2Sigma,
  }));
  const anchorX = xForIndex(historicalEndIndex);
  const anchorPrice = lastCandle?.close ?? levels.spot;
  const oneSigmaPolygon = buildConePolygon(
    anchorX,
    yForPrice(anchorPrice),
    projectedPoints.map((point) => ({ x: point.x, low: yForPrice(point.expectedLow1), high: yForPrice(point.expectedHigh1) })),
  );
  const twoSigmaPolygon = buildConePolygon(
    anchorX,
    yForPrice(anchorPrice),
    projectedPoints.map((point) => ({ x: point.x, low: yForPrice(point.stressLow2), high: yForPrice(point.stressHigh2) })),
  );
  const projectionLine = [
    `${anchorX},${yForPrice(anchorPrice)}`,
    ...projectedPoints.map((point) => `${point.x},${yForPrice(point.projection)}`),
  ].join(" ");
  const priceTicks = buildPriceTicks(minPrice, maxPrice);
  const timeTicks = buildTimeTicks(visibleCandles, selectedTimeframe);
  const candleWidth = Math.max(3, Math.min(12, (plotWidth / Math.max(visibleCandles.length, 1)) * 0.82));
  const activeX = hover?.x ?? xForIndex(activeIndex);
  const activeY = hover?.y ?? (activeCandle ? yForPrice(activeCandle.close) : margin.top);
  const activePrice = priceForY(activeY);

  useEffect(() => {
    setVisibleRange(getDefaultVisibleRange(candles.length, selectedTimeframe));
    setHover(null);
  }, [candles.length, selectedTimeframe, ticker]);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const screenMatrix = event.currentTarget.getScreenCTM();
    if (!screenMatrix) {
      return;
    }

    const transformed = point.matrixTransform(screenMatrix.inverse());
    const clampedX = Math.max(margin.left, Math.min(plotRight, transformed.x));
    const clampedY = Math.max(margin.top, Math.min(volumeTop + volumeHeight, transformed.y));
    if (dragState) {
      const candleSpan = Math.max(1, clampedRange.endIndex - clampedRange.startIndex + 1);
      const pixelsPerCandle = plotWidth / candleSpan;
      const deltaCandles = Math.round((dragState.startX - clampedX) / pixelsPerCandle);

      setVisibleRange(shiftVisibleRange(dragState.range, deltaCandles, candles.length));
      return;
    }

    const nearestIndex = getNearestCandleIndex(clampedX, visibleCandles.length, totalSlots, plotWidth);

    setHover({
      index: nearestIndex,
      x: xForIndex(nearestIndex),
      y: clampedY,
    });
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || visibleCandles.length <= 1) return;

    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const screenMatrix = event.currentTarget.getScreenCTM();
    if (!screenMatrix) return;

    const transformed = point.matrixTransform(screenMatrix.inverse());
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      startX: Math.max(margin.left, Math.min(plotRight, transformed.x)),
      range: clampedRange,
    });
  }

  function stopDragging() {
    setDragState(null);
  }

  function zoomVisibleRange(factor: number) {
    setVisibleRange((range) => zoomRange(clampVisibleRange(range, candles.length), factor, candles.length, selectedTimeframe));
    setHover(null);
  }

  function resetVisibleRange() {
    setVisibleRange(getDefaultVisibleRange(candles.length, selectedTimeframe));
    setHover(null);
  }

  function fitVisibleRange() {
    setVisibleRange({ startIndex: 0, endIndex: Math.max(candles.length - 1, 0) });
    setHover(null);
  }

  return (
    <div className="candlestick-frame">
      <div className="chart-platform-header">
        <div>
          <strong>{ticker}</strong>
          <span>{getTimeframeBadge(selectedTimeframe)}</span>
          <span>{marketLabel}</span>
          <span>{candlesLoaded} {language === "es" ? "velas" : "candles"}</span>
          <span>
            {language === "es"
              ? `Mostrando ${visibleCandles.length} de ${candles.length}`
              : `Showing ${visibleCandles.length} of ${candles.length}`}
          </span>
        </div>
        {activeCandle && (
          <div className="ohlcv-strip">
            <span>O {formatPrice(activeCandle.open)}</span>
            <span>H {formatPrice(activeCandle.high)}</span>
            <span>L {formatPrice(activeCandle.low)}</span>
            <span>C {formatPrice(activeCandle.close)}</span>
            <span>{language === "es" ? "Vol" : "Vol"} {formatVolume(activeCandle.volume)}</span>
            <span className={activeCandle.close >= activeCandle.open ? "value-positive" : "value-negative"}>
              {formatCandleChange(activeCandle)}
            </span>
          </div>
        )}
        <button
          className={`ema-toggle ${showEmas ? "is-active" : ""}`}
          onClick={() => setShowEmas((current) => !current)}
          type="button"
        >
          {language === "es" ? "Mostrar EMAs" : "Show EMAs"}
        </button>
        <div className="chart-nav-controls" aria-label={language === "es" ? "Navegacion del chart" : "Chart navigation"}>
          <button onClick={() => zoomVisibleRange(0.65)} type="button">Zoom +</button>
          <button onClick={() => zoomVisibleRange(1.35)} type="button">Zoom -</button>
          <button onClick={resetVisibleRange} type="button">Reset</button>
          <button onClick={fitVisibleRange} type="button">{language === "es" ? "Ajustar" : "Fit"}</button>
        </div>
      </div>

      <svg
        className="candlestick-svg"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={() => {
          setHover(null);
          stopDragging();
        }}
      >
        <defs>
          <linearGradient id="tvBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#071019" />
            <stop offset="100%" stopColor="#03070b" />
          </linearGradient>
          <clipPath id={plotClipId}>
            <rect x={margin.left} y={margin.top} width={plotWidth} height={priceHeight} />
          </clipPath>
        </defs>
        <rect width={width} height={height} fill="url(#tvBg)" />
        <rect x={margin.left} y={margin.top} width={plotWidth} height={priceHeight} fill="#050b12" />
        <rect x={margin.left} y={volumeTop} width={plotWidth} height={volumeHeight} fill="#040a10" />
        <line x1={plotRight} x2={plotRight} y1={margin.top} y2={height - margin.bottom + 10} stroke="rgba(255,255,255,0.14)" />
        <line x1={margin.left} x2={plotRight} y1={volumeTop - 18} y2={volumeTop - 18} stroke="rgba(255,255,255,0.08)" />

        {priceTicks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={plotRight} y1={yForPrice(tick)} y2={yForPrice(tick)} stroke="rgba(255,255,255,0.075)" />
            <text x={plotRight + 10} y={yForPrice(tick) + 4} fill="#8da2b4" fontSize="12">
              {formatPrice(tick)}
            </text>
          </g>
        ))}

        {timeTicks.map((index) => (
          <g key={`${visibleCandles[index]?.timestamp}-${index}`}>
            <line x1={xForIndex(index)} x2={xForIndex(index)} y1={margin.top} y2={volumeTop + volumeHeight} stroke="rgba(255,255,255,0.045)" />
            <text x={xForIndex(index)} y={height - 15} fill="#8da2b4" fontSize="11" textAnchor="middle">
              {formatTimeLabel(visibleCandles[index], selectedTimeframe)}
            </text>
          </g>
        ))}

        <g clipPath={`url(#${plotClipId})`}>
          {showFullCone && twoSigmaPolygon && <polygon points={twoSigmaPolygon} fill="rgba(58,134,255,0.12)" />}
          {showFullCone && oneSigmaPolygon && <polygon points={oneSigmaPolygon} fill="rgba(255,209,102,0.16)" />}
          {renderLevel(language === "es" ? "Resistencia / Call Wall" : "Resistance / Call Wall", levels.resistance, "#ff6b6b", yForPrice)}
          {renderLevel("Spot", levels.spot, "#9bf870", yForPrice, "2 0", true)}
          {renderLevel(language === "es" ? "Soporte / Put Wall" : "Support / Put Wall", levels.support, "#54d2ff", yForPrice)}
          {renderLevel("Max Pain", levels.maxPain, "#ffd166", yForPrice, "4 7")}

          {showEmas && renderEmaPath(ema20, visibleCandles, xForIndex, yForPrice, "#f8fbff")}
          {showEmas && renderEmaPath(ema50, visibleCandles, xForIndex, yForPrice, "#ffd166")}
          {showEmas && renderEmaPath(ema200, visibleCandles, xForIndex, yForPrice, "#3a86ff")}
        </g>

        {visibleCandles.map((candle, index) => {
          const x = xForIndex(index);
          const up = candle.close >= candle.open;
          const color = up ? "#26a69a" : "#ef5350";
          const wickColor = up ? "#7ee8dc" : "#ff8f8f";
          const openY = yForPrice(candle.open);
          const closeY = yForPrice(candle.close);
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(1.2, Math.abs(closeY - openY));
          const volumeHeightPx = (candle.volume / maxVolume) * volumeHeight;
          const isActive = hover?.index === index;

          return (
            <g key={`${candle.timestamp}-${index}`} opacity={hover && !isActive ? 0.62 : 1}>
              {isActive && <rect x={x - candleWidth * 0.75} y={margin.top} width={candleWidth * 1.5} height={priceHeight} fill="rgba(255,255,255,0.035)" />}
              <line x1={x} x2={x} y1={yForPrice(candle.high)} y2={yForPrice(candle.low)} stroke={wickColor} strokeWidth="1.2" />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx="1"
                fill={color}
                stroke={isActive ? "#f8fbff" : color}
                strokeWidth={isActive ? 1.2 : 0.4}
              />
              <rect
                x={x - candleWidth / 2}
                y={volumeTop + volumeHeight - volumeHeightPx}
                width={candleWidth}
                height={volumeHeightPx}
                rx="1"
                fill={color}
                opacity="0.36"
              />
            </g>
          );
        })}

        {(showFullCone || showPriceScaleProjectionPath) && (
          <g clipPath={`url(#${plotClipId})`}>
            <line x1={anchorX} x2={anchorX} y1={margin.top} y2={volumeTop + volumeHeight} stroke="rgba(255,255,255,0.18)" strokeDasharray="5 8" />
            <polyline
              points={projectionLine}
              fill="none"
              stroke="#f8f9fa"
              strokeWidth={scaleMode === "price" ? "1.5" : "2.4"}
              strokeDasharray="7 7"
              opacity={scaleMode === "price" ? "0.48" : "1"}
            />
          </g>
        )}

        {lastCandle && renderCurrentPriceLabel(lastCandle.close, yForPrice(lastCandle.close))}

        {hover && activeCandle && (
          <g className="chart-crosshair">
            <line x1={activeX} x2={activeX} y1={margin.top} y2={volumeTop + volumeHeight} stroke="rgba(248,251,255,0.42)" strokeDasharray="4 5" />
            <line x1={margin.left} x2={plotRight} y1={activeY} y2={activeY} stroke="rgba(248,251,255,0.28)" strokeDasharray="4 5" />
            <rect x={plotRight + 4} y={activeY - 11} width="86" height="22" rx="4" fill="#101923" stroke="rgba(248,251,255,0.18)" />
            <text x={plotRight + 47} y={activeY + 4} fill="#f8fbff" fontSize="11" textAnchor="middle">
              {formatPrice(activePrice)}
            </text>
            <rect x={activeX - 48} y={height - 35} width="96" height="22" rx="4" fill="#101923" stroke="rgba(248,251,255,0.18)" />
            <text x={activeX} y={height - 20} fill="#f8fbff" fontSize="11" textAnchor="middle">
              {formatTimeLabel(activeCandle, selectedTimeframe)}
            </text>
          </g>
        )}

        {activeCandle && hover && (
          <foreignObject x={Math.min(activeX + 14, plotRight - 220)} y={margin.top + 12} width="214" height="138">
            <div className="chart-hover-tooltip">
              <strong>{ticker}</strong>
              <span>{formatTooltipTime(activeCandle, selectedTimeframe)}</span>
              <span>O {formatPrice(activeCandle.open)} H {formatPrice(activeCandle.high)}</span>
              <span>L {formatPrice(activeCandle.low)} C {formatPrice(activeCandle.close)}</span>
              <span>{language === "es" ? "Volumen" : "Vol"} {formatVolume(activeCandle.volume)}</span>
              <em className={activeCandle.close >= activeCandle.open ? "value-positive" : "value-negative"}>{formatCandleChange(activeCandle)}</em>
            </div>
          </foreignObject>
        )}

        <text x={margin.left + 10} y={volumeTop - 10} fill="#8da2b4" fontSize="12">
          {language === "es" ? "Volumen" : "Volume"}
        </text>
        {showEmas && (
          <text x={margin.left + 10} y={margin.top + 18} fill="#8da2b4" fontSize="11">
            EMA 20 / EMA 50 / EMA 200
          </text>
        )}
      </svg>
    </div>
  );
}

function renderLevel(
  label: string,
  price: number,
  color: string,
  yForPrice: (price: number) => number,
  dash = "8 6",
  current = false,
) {
  const y = yForPrice(price);

  return (
    <g key={label}>
      <line x1={margin.left} x2={plotRight} y1={y} y2={y} stroke={color} strokeWidth={current ? "1.8" : "1.3"} strokeDasharray={dash} opacity={current ? 0.95 : 0.72} />
      <rect x={plotRight - 118} y={y - 13} width="114" height="22" rx="4" fill="rgba(3,7,11,0.78)" stroke={color} strokeOpacity="0.35" />
      <text x={plotRight - 61} y={y + 4} fill={color} fontSize="11" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function getDefaultVisibleRange(candleCount: number, timeframe: SelectedTimeframe): VisibleRange {
  if (candleCount <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const visibleCount = Math.min(getDefaultVisibleCount(timeframe), candleCount);

  return {
    startIndex: Math.max(0, candleCount - visibleCount),
    endIndex: candleCount - 1,
  };
}

function clampVisibleRange(range: VisibleRange, candleCount: number): VisibleRange {
  if (candleCount <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const span = Math.max(1, range.endIndex - range.startIndex + 1);
  let startIndex = Math.max(0, Math.min(range.startIndex, candleCount - 1));
  let endIndex = Math.min(candleCount - 1, startIndex + span - 1);

  if (endIndex - startIndex + 1 < span) {
    startIndex = Math.max(0, endIndex - span + 1);
  }

  return { startIndex, endIndex };
}

function shiftVisibleRange(range: VisibleRange, delta: number, candleCount: number): VisibleRange {
  const span = Math.max(1, range.endIndex - range.startIndex + 1);
  const maxStart = Math.max(0, candleCount - span);
  const startIndex = Math.max(0, Math.min(maxStart, range.startIndex + delta));

  return {
    startIndex,
    endIndex: Math.min(candleCount - 1, startIndex + span - 1),
  };
}

function zoomRange(range: VisibleRange, factor: number, candleCount: number, timeframe: SelectedTimeframe): VisibleRange {
  if (candleCount <= 0) return { startIndex: 0, endIndex: 0 };

  const currentSpan = Math.max(1, range.endIndex - range.startIndex + 1);
  const nextSpan = Math.max(getMinVisibleCount(candleCount, timeframe), Math.min(candleCount, Math.round(currentSpan * factor)));
  const center = (range.startIndex + range.endIndex) / 2;
  const startIndex = Math.round(center - nextSpan / 2);

  return clampVisibleRange({ startIndex, endIndex: startIndex + nextSpan - 1 }, candleCount);
}

function getDefaultVisibleCount(timeframe: SelectedTimeframe): number {
  return defaultVisibleCounts[timeframe] ?? 100;
}

function getMinVisibleCount(candleCount: number, timeframe?: SelectedTimeframe): number {
  const minimum = timeframe ? minVisibleCounts[timeframe] : 20;

  return Math.min(minimum ?? 20, Math.max(1, candleCount));
}

function renderCurrentPriceLabel(price: number, y: number) {
  return (
    <g>
      <line x1={margin.left} x2={plotRight} y1={y} y2={y} stroke="#9bf870" strokeWidth="1" strokeDasharray="2 4" opacity="0.8" />
      <rect x={plotRight + 4} y={y - 12} width="86" height="24" rx="4" fill="#9bf870" />
      <text x={plotRight + 47} y={y + 4} fill="#041016" fontSize="11" fontWeight="800" textAnchor="middle">
        {formatPrice(price)}
      </text>
    </g>
  );
}

function renderEmaPath(
  values: Array<number | null>,
  candles: NormalizedCandle[],
  xForIndex: (index: number) => number,
  yForPrice: (price: number) => number,
  color: string,
) {
  const path = values
    .map((value, index) => (value === null ? "" : `${xForIndex(index)},${yForPrice(value)}`))
    .filter(Boolean)
    .join(" ");

  if (!path) return null;

  return <polyline points={path} fill="none" stroke={color} strokeWidth="1.4" opacity="0.86" />;
}

function buildConePolygon(anchorX: number, anchorY: number, points: { x: number; low: number; high: number }[]): string {
  if (points.length === 0) return "";

  const upper = [`${anchorX},${anchorY}`, ...points.map((point) => `${point.x},${point.high}`)];
  const lower = [...points].reverse().map((point) => `${point.x},${point.low}`);

  return [...upper, ...lower, `${anchorX},${anchorY}`].join(" ");
}

function buildPriceTicks(minPrice: number, maxPrice: number): number[] {
  const step = (maxPrice - minPrice) / 6;

  return Array.from({ length: 7 }, (_, index) => Math.round((minPrice + step * index) * 100) / 100);
}

function buildTimeTicks(candles: NormalizedCandle[], timeframe: SelectedTimeframe): number[] {
  if (candles.length === 0) return [];

  const maxTicks = timeframe === "1D_1M" ? 8 : timeframe === "5D_15M" ? 9 : timeframe === "3M_4H" ? 8 : timeframe === "5D_5M" ? 8 : timeframe === "30D_30M" ? 9 : 7;
  const step = Math.max(1, Math.ceil(candles.length / maxTicks));
  const ticks = candles.map((_, index) => index).filter((index) => index % step === 0);
  const last = candles.length - 1;

  return ticks.includes(last) ? ticks : [...ticks, last];
}

function getNearestCandleIndex(x: number, candleCount: number, totalSlots: number, plotWidth: number): number {
  if (candleCount <= 1) return 0;

  const rawIndex = Math.round(((x - margin.left) / plotWidth) * (Math.max(totalSlots, 2) - 1));

  return Math.max(0, Math.min(candleCount - 1, rawIndex));
}

function formatTimeLabel(candle: NormalizedCandle | undefined, timeframe: SelectedTimeframe): string {
  if (!candle) return "";
  const date = new Date(candle.timestamp);

  if (Number.isNaN(date.getTime())) return candle.date;
  if (timeframe === "1D_1M" || timeframe === "5D_5M") {
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  if (timeframe === "5D_15M" || timeframe === "3M_4H" || timeframe === "30D_30M") {
    return date.toLocaleString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipTime(candle: NormalizedCandle, timeframe: SelectedTimeframe): string {
  const date = new Date(candle.timestamp);

  if (Number.isNaN(date.getTime())) return candle.date;
  if (timeframe === "1Y_1D" || timeframe === "3M_1D") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getTimeframeBadge(timeframe: SelectedTimeframe): string {
  const labels: Record<SelectedTimeframe, string> = {
    "1D_1M": "1D / 1m",
    "5D_15M": "5D / 15m",
    "3M_4H": "3M / 4H",
    "1Y_1D": "1Y / 1D",
    "5D_5M": "5D / 5M",
    "30D_30M": "30D / 30M",
    "3M_1D": "3M / 1D",
  };

  return labels[timeframe];
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function formatCandleChange(candle: NormalizedCandle): string {
  if (candle.open === 0) return "0.00%";
  const change = ((candle.close - candle.open) / candle.open) * 100;
  const prefix = change > 0 ? "+" : "";

  return `${prefix}${change.toFixed(2)}%`;
}
