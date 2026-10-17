import React, { useState, useEffect } from 'react';
import { SignalForecast, ForexPair } from '../types/trading';
import { calculateDriftPips, formatPrice } from '../utils/formatters';
import {
  Bell,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Slash,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

interface SignalCardProps {
  signal: SignalForecast | null;
  currentPrice: number;
  driftTolerance: number;
  onExecutePaperTrade: (signal: SignalForecast) => void;
  isStale: boolean;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  currentPrice,
  driftTolerance,
  onExecutePaperTrade,
  isStale,
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!signal) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((signal.scheduledTimestamp - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [signal]);

  const copySignal = () => {
    if (!signal) return;
    navigator.clipboard.writeText(signal.formattedSignal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!signal) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">Evaluating Market Conditions</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Forecasting engine is synchronizing with live feed and computing technical consensus.
        </p>
      </div>
    );
  }

  // Calculate live drift
  const currentDrift = calculateDriftPips(signal.pair, signal.referenceEntryPrice, currentPrice);
  const isDriftExceeded = currentDrift > driftTolerance;
  const isExpired = secondsRemaining === 0 && Date.now() > signal.scheduledTimestamp + 15000;

  // Formatting minutes and seconds
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const getDirectionBadge = () => {
    if (signal.direction === 'UP') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-sm">
          <ArrowUpRight className="w-4 h-4" />
          UP (CALL)
        </div>
      );
    }
    if (signal.direction === 'DOWN') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-bold text-sm">
          <ArrowDownRight className="w-4 h-4" />
          DOWN (PUT)
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold text-sm">
        <Slash className="w-4 h-4" />
        NO TRADE
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
      <div>
        {/* Header with 2-Minute Pre-Notification status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              2-Min Forecast Alert
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Exp: {signal.timeframe} (Default 5m)
            </span>
            <button
              onClick={copySignal}
              title="Copy Signal in Standard Format"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* SPEC REQUIREMENT: Format signal exactly as: TIME | ENTRY PRICE | UP/DOWN */}
        <div className="my-4 p-3.5 rounded-lg bg-slate-950/90 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Target Signal Format
            </span>
            {getDirectionBadge()}
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-slate-100 tracking-wider">
            {signal.formattedSignal}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            Standard Format: TIME | ENTRY PRICE | UP/DOWN (Africa/Lagos 24h)
          </p>
        </div>

        {/* 2-Minute Entry Countdown Timer */}
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/80 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Scheduled Entry Window:</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-amber-300">
                {secondsRemaining > 0 ? timerDisplay : 'ENTRY TIME'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">
                {secondsRemaining > 0 ? 'until Lagos ' + signal.scheduledTime : 'Active window'}
              </span>
            </div>
          </div>

          {/* Reference Price & Drift Guard */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Ref Price</span>
              <span className="text-slate-200 font-semibold">
                {formatPrice(signal.pair, signal.referenceEntryPrice)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Live Drift</span>
              <span
                className={`font-semibold ${
                  isDriftExceeded ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {currentDrift.toFixed(1)} pips
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Drift Guard</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isDriftExceeded
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isDriftExceeded ? 'CANCEL (> ' + driftTolerance + 'p)' : 'VALID (≤ ' + driftTolerance + 'p)'}
              </span>
            </div>
          </div>
        </div>

        {/* Forecast Probabilities */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Forecast Probabilities</span>
            <span className="text-[11px] font-mono text-slate-300">
              Confidence: {(signal.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            {/* UP */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase block">UP (CALL)</span>
              <span className="text-sm font-bold text-slate-200">
                {(signal.probabilities.up * 100).toFixed(1)}%
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${signal.probabilities.up * 100}%` }}
                />
              </div>
            </div>

            {/* DOWN */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-rose-400 uppercase block">DOWN (PUT)</span>
              <span className="text-sm font-bold text-slate-200">
                {(signal.probabilities.down * 100).toFixed(1)}%
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${signal.probabilities.down * 100}%` }}
                />
              </div>
            </div>

            {/* NO TRADE */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase block">NO TRADE</span>
              <span className="text-sm font-bold text-slate-200">
                {(signal.probabilities.noTrade * 100).toFixed(1)}%
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${signal.probabilities.noTrade * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning / Technical Consensus */}
        <div className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/80 mb-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Engine Rationale:
          </span>
          <ul className="text-xs text-slate-300 space-y-0.5">
            {signal.reasoning.map((r, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-emerald-400">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action: Execute Paper Trade */}
      <div>
        {signal.direction === 'NO TRADE' ? (
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-center text-xs text-amber-300">
            Market regime fails confidence or volatility threshold. Trade skipped.
          </div>
        ) : isDriftExceeded ? (
          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Price drifted {currentDrift.toFixed(1)} pips (&gt; {driftTolerance}p). Trade cancelled.
          </div>
        ) : (
          <button
            onClick={() => onExecutePaperTrade(signal)}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" />
            Simulate Paper Entry ($100 @ 85% Payout)
          </button>
        )}
      </div>
    </div>
  );
};
