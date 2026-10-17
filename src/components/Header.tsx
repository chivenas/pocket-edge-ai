import React, { useState, useEffect } from 'react';
import { ForexPair, Timeframe } from '../types/trading';
import { getLagosTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  AlertTriangle,
  Database,
  BarChart2,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  selectedPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  currentPrice: number;
}

const AVAILABLE_PAIRS: ForexPair[] = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'EUR/GBP',
];

const TIMEFRAMES: { id: Timeframe; label: string; default?: boolean }[] = [
  { id: '1m', label: '1 Min' },
  { id: '3m', label: '3 Min' },
  { id: '5m', label: '5 Min (Default)', default: true },
];

export const Header: React.FC<HeaderProps> = ({
  selectedPair,
  onSelectPair,
  selectedTimeframe,
  onSelectTimeframe,
  currentPrice,
}) => {
  const { user, signInWithGoogle, signOutUser, dbConnected } = useAuth();
  const [lagosClock, setLagosClock] = useState(getLagosTime());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLagosClock(getLagosTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Market Selectors */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-base">
                  Pocket Edge <span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                  Paper Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Forex Signal Forecasting</p>
            </div>
          </div>

          {/* Pair selector pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {AVAILABLE_PAIRS.map((pair) => (
              <button
                key={pair}
                onClick={() => onSelectPair(pair)}
                className={`px-2.5 py-1 text-xs font-mono rounded font-medium transition-all ${
                  selectedPair === pair
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>

          {/* Mobile pair dropdown */}
          <div className="lg:hidden">
            <select
              value={selectedPair}
              onChange={(e) => onSelectPair(e.target.value as ForexPair)}
              aria-label="Select Forex Pair"
              className="bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 rounded px-2 py-1.5 focus:outline-none"
            >
              {AVAILABLE_PAIRS.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Timeframe & Expiry Selection */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => onSelectTimeframe(tf.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  selectedTimeframe === tf.id
                    ? 'bg-slate-800 text-slate-100 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.id}
                {tf.default && <span className="ml-1 text-[9px] text-emerald-400">★</span>}
              </button>
            ))}
          </div>

          {/* Lagos Timezone Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-medium">{lagosClock.timeStringWithSeconds}</span>
            <span className="text-[10px] text-slate-500">WAT (24h)</span>
          </div>
        </div>

        {/* Right: DB Status & Auth */}
        <div className="flex items-center gap-3">
          {/* Firestore indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border ${
              dbConnected
                ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-900/40 text-amber-400'
            }`}
            title={dbConnected ? 'Firestore is online' : 'Connecting to Firestore'}
          >
            <Database className="w-3 h-3" />
            <span>{dbConnected ? 'Firestore OK' : 'Connecting...'}</span>
          </div>

          {/* Auth Button / Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{user.displayName || user.email}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-800 shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName || 'Trader'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Authenticated Session</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOutUser();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
