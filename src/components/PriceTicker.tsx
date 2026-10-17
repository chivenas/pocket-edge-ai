import React from 'react';
import { MarketTicker } from '../types/trading';
import { formatPrice } from '../utils/formatters';
import { Activity, ShieldAlert, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';

interface PriceTickerProps {
  ticker: MarketTicker;
  driftTolerance: number;
  onUpdateDriftTolerance: (pips: number) => void;
  onRefreshData?: () => void;
  isLoading?: boolean;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({
  ticker,
  driftTolerance,
  onUpdateDriftTolerance,
  onRefreshData,
  isLoading,
}) => {
  const isPositive = ticker.change24h >= 0;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Live Quotes */}
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              {ticker.pair} Live Mid
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
                {formatPrice(ticker.pair, ticker.mid)}
              </span>
              <span
                className={`text-xs font-mono font-medium ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {ticker.change24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Bid / Ask & Spread */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono border-l border-slate-800 pl-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Bid</span>
              <span className="text-slate-300 font-semibold">{formatPrice(ticker.pair, ticker.bid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Ask</span>
              <span className="text-slate-300 font-semibold">{formatPrice(ticker.pair, ticker.ask)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Spread</span>
              <span className="text-amber-400 font-semibold">{ticker.spreadPips.toFixed(1)} pips</span>
            </div>
          </div>

          {/* 24h High / Low */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono border-l border-slate-800 pl-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">24h High</span>
              <span className="text-slate-300">{formatPrice(ticker.pair, ticker.high24h)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">24h Low</span>
              <span className="text-slate-300">{formatPrice(ticker.pair, ticker.low24h)}</span>
            </div>
          </div>
        </div>

        {/* Data Freshness, Calibration & Controls */}
        <div className="flex items-center gap-3">
          {/* Source & Freshness */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                ticker.isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-slate-400">Feed:</span>
            <span className="text-slate-200">{ticker.source}</span>
            <span className="text-slate-500">|</span>
            <span className={ticker.isStale ? 'text-amber-400' : 'text-emerald-400'}>
              {ticker.isStale ? 'STALE (>30s)' : 'FRESH'}
            </span>
          </div>

          {/* Drift Tolerance Config */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Drift Tol:</span>
            <select
              value={driftTolerance}
              onChange={(e) => onUpdateDriftTolerance(parseFloat(e.target.value))}
              aria-label="Drift Tolerance in Pips"
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="1.0" className="bg-slate-900">1.0 pip</option>
              <option value="1.5" className="bg-slate-900">1.5 pips (Default)</option>
              <option value="2.0" className="bg-slate-900">2.0 pips</option>
              <option value="3.0" className="bg-slate-900">3.0 pips</option>
            </select>
          </div>

          {/* Model Status */}
          <div className="hidden xl:flex items-center gap-1 bg-emerald-950/30 text-emerald-300 border border-emerald-900/40 px-2 py-1 rounded text-[10px] font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Walk-Forward Validated</span>
          </div>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              title="Refresh Market Data"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
