import React, { useState, useRef } from 'react';
import { Candlestick, ForexPair, Timeframe, TechnicalIndicators } from '../types/trading';
import { formatPrice, getLagosTime } from '../utils/formatters';
import { Layers, Eye, EyeOff } from 'lucide-react';

interface CandlestickChartProps {
  pair: ForexPair;
  timeframe: Timeframe;
  candles: Candlestick[];
  currentPrice: number;
  indicators: TechnicalIndicators;
  signalEntryPrice?: number;
  signalDirection?: 'UP' | 'DOWN' | 'NO TRADE';
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  pair,
  timeframe,
  candles,
  currentPrice,
  indicators,
  signalEntryPrice,
  signalDirection,
}) => {
  const [showEma, setShowEma] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candlestick | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!candles || candles.length === 0) {
    return (
      <div className="h-[380px] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
        Loading Candlestick Data...
      </div>
    );
  }

  // Chart dimensions & scaling
  const width = 800;
  const height = 360;
  const padding = { top: 20, right: 70, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate min & max price
  const prices = candles.flatMap((c) => [c.low, c.high]);
  if (signalEntryPrice) prices.push(signalEntryPrice);
  if (showBB && indicators.bollingerBands) {
    prices.push(indicators.bollingerBands.upper, indicators.bollingerBands.lower);
  }

  const minPrice = Math.min(...prices) * 0.9998;
  const maxPrice = Math.max(...prices) * 1.0002;
  const priceRange = maxPrice - minPrice || 0.001;

  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleSpacing = chartWidth / candles.length;
  const candleWidth = Math.max(3, candleSpacing * 0.65);

  const getX = (index: number) => {
    return padding.left + index * candleSpacing + candleSpacing / 2;
  };

  // Generate price axis steps
  const priceSteps = 5;
  const axisPrices = Array.from({ length: priceSteps }, (_, i) => {
    return minPrice + (priceRange / (priceSteps - 1)) * i;
  });

  // Calculate EMA points across candles
  const calculateEmaPoints = (period: number) => {
    if (candles.length < period) return '';
    const k = 2 / (period + 1);
    let ema = candles[0].close;
    const points: string[] = [];

    candles.forEach((c, i) => {
      ema = c.close * k + ema * (1 - k);
      if (i >= period - 1) {
        const x = getX(i);
        const y = getY(ema);
        points.push(`${x},${y}`);
      }
    });

    return points.join(' ');
  };

  const ema9Polyline = calculateEmaPoints(9);
  const ema21Polyline = calculateEmaPoints(21);
  const ema50Polyline = calculateEmaPoints(50);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    const candleIdx = Math.floor((svgX - padding.left) / candleSpacing);
    if (candleIdx >= 0 && candleIdx < candles.length) {
      setHoveredCandle(candles[candleIdx]);
      setHoverX(getX(candleIdx));
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setHoverX(null);
  };

  const currentPriceY = getY(currentPrice);
  const signalY = signalEntryPrice ? getY(signalEntryPrice) : null;

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 flex flex-col">
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-slate-100">{pair}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {timeframe} Candlestick
          </span>
          {hoveredCandle ? (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                O: <span className="text-slate-200">{formatPrice(pair, hoveredCandle.open)}</span>
              </span>
              <span className="text-slate-400">
                H: <span className="text-emerald-400">{formatPrice(pair, hoveredCandle.high)}</span>
              </span>
              <span className="text-slate-400">
                L: <span className="text-rose-400">{formatPrice(pair, hoveredCandle.low)}</span>
              </span>
              <span className="text-slate-400">
                C: <span className="text-slate-200">{formatPrice(pair, hoveredCandle.close)}</span>
              </span>
              <span className="text-slate-500">
                {getLagosTime(hoveredCandle.time).timeStringWithSeconds} WAT
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>EMA9 (Blue)</span>
              <span>•</span>
              <span>EMA21 (Amber)</span>
              <span>•</span>
              <span>EMA50 (Purple)</span>
            </div>
          )}
        </div>

        {/* Overlay Toggles */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowEma(!showEma)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
              showEma
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Layers className="w-3 h-3" />
            EMA (9/21/50)
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
              showBB
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            BB (20,2)
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative w-full h-[320px] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines and price axis labels */}
          {axisPrices.map((p, i) => {
            const y = getY(p);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3,3"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {formatPrice(pair, p)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Channel */}
          {showBB && indicators.bollingerBands && (
            <g>
              <line
                x1={padding.left}
                y1={getY(indicators.bollingerBands.upper)}
                x2={width - padding.right}
                y2={getY(indicators.bollingerBands.upper)}
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              <line
                x1={padding.left}
                y1={getY(indicators.bollingerBands.lower)}
                x2={width - padding.right}
                y2={getY(indicators.bollingerBands.lower)}
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="4,4"
                opacity="0.4"
              />
            </g>
          )}

          {/* EMA Polylines */}
          {showEma && (
            <>
              {ema50Polyline && (
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.2"
                  opacity="0.75"
                  points={ema50Polyline}
                />
              )}
              {ema21Polyline && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  opacity="0.85"
                  points={ema21Polyline}
                />
              )}
              {ema9Polyline && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  points={ema9Polyline}
                />
              )}
            </>
          )}

          {/* Candlesticks */}
          {candles.map((candle, idx) => {
            const isBullish = candle.close >= candle.open;
            const x = getX(idx);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
            const color = isBullish ? '#10b981' : '#f43f5e';

            return (
              <g key={candle.time}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* Signal Reference Price Line */}
          {signalY !== null && signalEntryPrice && (
            <g>
              <line
                x1={padding.left}
                y1={signalY}
                x2={width - padding.right}
                y2={signalY}
                stroke={signalDirection === 'UP' ? '#10b981' : '#f43f5e'}
                strokeWidth="1.5"
                strokeDasharray="5,3"
              />
              <rect
                x={width - padding.right}
                y={signalY - 9}
                width="65"
                height="18"
                fill={signalDirection === 'UP' ? '#064e3b' : '#881337'}
                rx="2"
              />
              <text
                x={width - padding.right + 4}
                y={signalY + 3}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                SIG {signalDirection}
              </text>
            </g>
          )}

          {/* Live Market Price Line */}
          <line
            x1={padding.left}
            y1={currentPriceY}
            x2={width - padding.right}
            y2={currentPriceY}
            stroke="#e2e8f0"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
          <rect
            x={width - padding.right}
            y={currentPriceY - 8}
            width="65"
            height="16"
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="1"
            rx="2"
          />
          <text
            x={width - padding.right + 4}
            y={currentPriceY + 3}
            fill="#38bdf8"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {formatPrice(pair, currentPrice)}
          </text>

          {/* Hover Crosshair */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={padding.top}
              x2={hoverX}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
