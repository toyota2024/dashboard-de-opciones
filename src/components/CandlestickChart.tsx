import { useMemo, useState } from "react";
import {
  getOhlcPriceRange,
  indexToChartX,
  normalizeCandles,
  priceToChartY,
} from "../lib/candlestickScale";
import { formatPrice } from "../lib/formatters";
import { calculateEMA } from "../lib/indicators";
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
};

type HoverState = {
  index: number;
  x: number;
  y: number;
};

const width = 1120;
const height = 620;
const margin = { top: 30, right: 94, bottom: 48, left: 18 };
const priceHeight = 420;
const volumeTop = 486;
const volumeHeight = 82;
const plotRight = width - margin.right;

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
}: CandlestickChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const candles = useMemo(() => normalizeCandles(historicalPath), [historicalPath]);
  const visibleProjectedPath = showProjectionOverlays ? projectedPath : [];
  const [minPrice, maxPrice] = getOhlcPriceRange(historicalPath, levels, expectedMove);
  const plotWidth = plotRight - margin.left;
  const lastCandle = candles[candles.length - 1];
  const activeIndex = hover?.index ?? Math.max(candles.length - 1, 0);
  const activeCandle = candles[activeIndex] ?? lastCandle;
  const maxVolume = Math.max(...candles.map((candle) => candle.volume), 1);
  const totalSlots = candles.length + visibleProjectedPath.length;
  const historicalEndIndex = Math.max(candles.length - 1, 0);
  const closes = candles.map((candle) => candle.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const xForIndex = (index: number) => margin.left + indexToChartX(index, Math.max(totalSlots, 2), plotWidth);
  const yForPrice = (price: number) => margin.top + (priceToChartY(price, minPrice, maxPrice) / 100) * priceHeight;
  const priceForY = (y: number) => maxPrice - ((y - margin.top) / priceHeight) * (maxPrice - minPrice);
  const projectedPoints = visibleProjectedPath.map((point, index) => ({
    x: xForIndex(candles.length + index),
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
  const timeTicks = buildTimeTicks(candles, selectedTimeframe);
  const candleWidth = Math.max(2, Math.min(18, (plotWidth / Math.max(totalSlots, 1)) * 0.62));
  const activeX = hover?.x ?? xForIndex(activeIndex);
  const activeY = hover?.y ?? (activeCandle ? yForPrice(activeCandle.close) : margin.top);
  const activePrice = priceForY(activeY);

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
    const nearestIndex = getNearestCandleIndex(clampedX, candles.length, totalSlots, plotWidth);

    setHover({
      index: nearestIndex,
      x: xForIndex(nearestIndex),
      y: clampedY,
    });
  }

  return (
    <div className="candlestick-frame">
      <div className="chart-platform-header">
        <div>
          <strong>{ticker}</strong>
          <span>{getTimeframeBadge(selectedTimeframe)}</span>
          <span>{marketLabel}</span>
          <span>{candlesLoaded} candles</span>
        </div>
        {activeCandle && (
          <div className="ohlcv-strip">
            <span>O {formatPrice(activeCandle.open)}</span>
            <span>H {formatPrice(activeCandle.high)}</span>
            <span>L {formatPrice(activeCandle.low)}</span>
            <span>C {formatPrice(activeCandle.close)}</span>
            <span>Vol {formatVolume(activeCandle.volume)}</span>
            <span className={activeCandle.close >= activeCandle.open ? "value-positive" : "value-negative"}>
              {formatCandleChange(activeCandle)}
            </span>
          </div>
        )}
      </div>

      <svg
        className="candlestick-svg"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="tvBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#071019" />
            <stop offset="100%" stopColor="#03070b" />
          </linearGradient>
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
          <g key={`${candles[index]?.timestamp}-${index}`}>
            <line x1={xForIndex(index)} x2={xForIndex(index)} y1={margin.top} y2={volumeTop + volumeHeight} stroke="rgba(255,255,255,0.045)" />
            <text x={xForIndex(index)} y={height - 15} fill="#8da2b4" fontSize="11" textAnchor="middle">
              {formatTimeLabel(candles[index], selectedTimeframe)}
            </text>
          </g>
        ))}

        {showProjectionOverlays && twoSigmaPolygon && <polygon points={twoSigmaPolygon} fill="rgba(58,134,255,0.12)" />}
        {showProjectionOverlays && oneSigmaPolygon && <polygon points={oneSigmaPolygon} fill="rgba(255,209,102,0.16)" />}
        {renderLevel("Resistance / Call Wall", levels.resistance, "#ff6b6b", yForPrice)}
        {renderLevel("Spot", levels.spot, "#9bf870", yForPrice, "2 0", true)}
        {renderLevel("Support / Put Wall", levels.support, "#54d2ff", yForPrice)}
        {renderLevel("Max Pain", levels.maxPain, "#ffd166", yForPrice, "4 7")}

        {renderEmaPath(ema20, candles, xForIndex, yForPrice, "#f8fbff")}
        {renderEmaPath(ema50, candles, xForIndex, yForPrice, "#ffd166")}
        {renderEmaPath(ema200, candles, xForIndex, yForPrice, "#3a86ff")}

        {candles.map((candle, index) => {
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

        {showProjectionOverlays && (
          <>
            <line x1={anchorX} x2={anchorX} y1={margin.top} y2={volumeTop + volumeHeight} stroke="rgba(255,255,255,0.18)" strokeDasharray="5 8" />
            <polyline points={projectionLine} fill="none" stroke="#f8f9fa" strokeWidth="2.4" strokeDasharray="7 7" />
          </>
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
              <span>Vol {formatVolume(activeCandle.volume)}</span>
              <em className={activeCandle.close >= activeCandle.open ? "value-positive" : "value-negative"}>{formatCandleChange(activeCandle)}</em>
            </div>
          </foreignObject>
        )}

        <text x={margin.left + 10} y={volumeTop - 10} fill="#8da2b4" fontSize="12">
          Volume
        </text>
        <text x={margin.left + 10} y={margin.top + 18} fill="#8da2b4" fontSize="11">
          EMA 20 / EMA 50 / EMA 200
        </text>
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

  const maxTicks = timeframe === "5D_5M" ? 8 : timeframe === "30D_30M" ? 9 : 7;
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
  if (timeframe === "5D_5M") {
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  if (timeframe === "30D_30M") {
    return date.toLocaleString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipTime(candle: NormalizedCandle, timeframe: SelectedTimeframe): string {
  const date = new Date(candle.timestamp);

  if (Number.isNaN(date.getTime())) return candle.date;
  if (timeframe === "3M_1D") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getTimeframeBadge(timeframe: SelectedTimeframe): string {
  const labels: Record<SelectedTimeframe, string> = {
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
