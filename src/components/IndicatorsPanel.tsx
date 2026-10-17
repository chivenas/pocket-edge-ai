import React from 'react';
import { TechnicalIndicators, ForexPair } from '../types/trading';
import { formatPrice } from '../utils/formatters';
import { Activity, Gauge, TrendingUp, BarChart2, Compass } from 'lucide-react';

interface IndicatorsPanelProps {
  pair: ForexPair;
  indicators: TechnicalIndicators;
  currentPrice: number;
}

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({
  pair,
  indicators,
  currentPrice,
}) => {
  // Determine EMA structure
  const emaBullish =
    indicators.ema9 > indicators.ema21 && indicators.ema21 > indicators.ema50;
  const emaBearish =
    indicators.ema9 < indicators.ema21 && indicators.ema21 < indicators.ema50;

  // Determine RSI regime
  const rsiState =
    indicators.rsi >= 70
      ? 'Overbought (>70)'
      : indicators.rsi <= 30
      ? 'Oversold (<30)'
      : 'Neutral (30-70)';

  // Determine ADX trend strength
  const adxState =
    indicators.adx >= 25
      ? 'Strong Trend (>25)'
      : indicators.adx >= 20
      ? 'Emerging Trend'
      : 'Weak/Consolidating (<20)';

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-semibold uppercase text-slate-200">
            Technical Indicator Engine
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Walk-Forward Computation (No Future-Data Leakage)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* EMA 9 / 21 / 50 */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>EMA Triad</span>
            <TrendingUp className="w-3 h-3 text-sky-400" />
          </div>
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex justify-between text-sky-300">
              <span className="text-[10px] text-slate-500">9:</span>
              <span>{formatPrice(pair, indicators.ema9)}</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span className="text-[10px] text-slate-500">21:</span>
              <span>{formatPrice(pair, indicators.ema21)}</span>
            </div>
            <div className="flex justify-between text-purple-300">
              <span className="text-[10px] text-slate-500">50:</span>
              <span>{formatPrice(pair, indicators.ema50)}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono font-semibold">
            <span
              className={
                emaBullish
                  ? 'text-emerald-400'
                  : emaBearish
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }
            >
              {emaBullish ? 'Bullish Stack' : emaBearish ? 'Bearish Stack' : 'Mixed Alignment'}
            </span>
          </div>
        </div>

        {/* RSI (14) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>RSI (14)</span>
            <Gauge className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {indicators.rsi.toFixed(1)}
          </div>
          {/* Visual Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                indicators.rsi >= 70
                  ? 'bg-rose-500'
                  : indicators.rsi <= 30
                  ? 'bg-emerald-500'
                  : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, indicators.rsi))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">
            {rsiState}
          </span>
        </div>

        {/* MACD (12, 26, 9) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>MACD</span>
            <BarChart2 className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-[10px] text-slate-500">Hist:</span>
              <span
                className={
                  indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {(indicators.macd.histogram * 10000).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="text-[10px] text-slate-500">MACD:</span>
              <span>{(indicators.macd.macdLine * 10000).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="text-[10px] text-slate-500">Signal:</span>
              <span>{(indicators.macd.signalLine * 10000).toFixed(2)}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            {indicators.macd.histogram >= 0 ? 'Bullish Mom.' : 'Bearish Mom.'}
          </span>
        </div>

        {/* Bollinger Bands (20, 2) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>Bollinger (20,2)</span>
            <Activity className="w-3 h-3 text-teal-400" />
          </div>
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex justify-between text-emerald-300 text-[11px]">
              <span className="text-[10px] text-slate-500">Upper:</span>
              <span>{formatPrice(pair, indicators.bollingerBands.upper)}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span className="text-[10px] text-slate-500">Mid:</span>
              <span>{formatPrice(pair, indicators.bollingerBands.middle)}</span>
            </div>
            <div className="flex justify-between text-rose-300 text-[11px]">
              <span className="text-[10px] text-slate-500">Lower:</span>
              <span>{formatPrice(pair, indicators.bollingerBands.lower)}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-teal-400 mt-1 block">
            Envelope Channel
          </span>
        </div>

        {/* ATR (14) Volatility */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>ATR (14)</span>
            <Activity className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {(indicators.atr * (pair.includes('JPY') ? 100 : 10000)).toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">pips</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            <span>Regime: Normal Volatility</span>
          </div>
        </div>

        {/* ADX (14) Trend Strength */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>ADX (14)</span>
            <Compass className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {indicators.adx.toFixed(1)}
          </div>
          {/* Visual Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                indicators.adx >= 25 ? 'bg-purple-500' : 'bg-slate-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (indicators.adx / 60) * 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">
            {adxState}
          </span>
        </div>
      </div>
    </div>
  );
};
