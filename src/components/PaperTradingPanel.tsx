import React, { useState } from 'react';
import { PaperTrade, PerformanceStats, SignalForecast } from '../types/trading';
import { formatCurrency, formatPrice, getLagosTime } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ListFilter,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface PaperTradingPanelProps {
  trades: PaperTrade[];
  signals: SignalForecast[];
  stats: PerformanceStats;
  currentPrice: number;
  onResetAccount: () => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  trades,
  signals,
  stats,
  currentPrice,
  onResetAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'signals'>('positions');

  const openTrades = trades.filter((t) => t.status === 'OPEN');
  const closedTrades = trades.filter((t) => t.status !== 'OPEN');

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
      {/* Top: Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {/* Balance */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>Simulated Balance</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {formatCurrency(stats.simulatedBalance)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
            PnL: {stats.netProfit >= 0 ? '+' : ''}
            {formatCurrency(stats.netProfit)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>Win Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {stats.winningTrades}W / {stats.losingTrades}L
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>Profit Factor</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Total Trades: {stats.totalTrades}
          </div>
        </div>

        {/* Cancelled via Drift Guard */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>Drift Rejections</span>
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-amber-300">
            {stats.cancelledTradesCount}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Avg Drift: {stats.averageDriftPips.toFixed(1)}p
          </div>
        </div>

        {/* Reset Account */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400 uppercase">
            Simulation Control
          </div>
          <button
            onClick={onResetAccount}
            className="w-full py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to $10,000
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1 text-xs font-mono rounded font-medium transition-colors ${
              activeTab === 'positions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Positions ({openTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-xs font-mono rounded font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trade History ({closedTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3 py-1 text-xs font-mono rounded font-medium transition-colors ${
              activeTab === 'signals'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Signal Audit Log ({signals.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Active Positions */}
      {activeTab === 'positions' && (
        <div className="overflow-x-auto">
          {openTrades.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No open paper positions. Simulated orders execute automatically when scheduled entry matches or when manually triggered.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2 px-2">Pair</th>
                  <th className="py-2 px-2">Direction</th>
                  <th className="py-2 px-2">Entry Price</th>
                  <th className="py-2 px-2">Current Price</th>
                  <th className="py-2 px-2">Stake</th>
                  <th className="py-2 px-2">Expiry Time (WAT)</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {openTrades.map((trade) => {
                  const inMoney =
                    trade.direction === 'UP'
                      ? currentPrice > trade.entryPrice
                      : currentPrice < trade.entryPrice;
                  return (
                    <tr key={trade.id} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-2 font-bold text-slate-200">{trade.pair}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.direction === 'UP'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {trade.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-300">
                        {formatPrice(trade.pair, trade.entryPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-100 font-semibold">
                        {formatPrice(trade.pair, currentPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-300">{formatCurrency(trade.amount)}</td>
                      <td className="py-2.5 px-2 text-amber-300">{trade.expiryTimeStr}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            inMoney
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {inMoney ? 'IN THE MONEY' : 'OUT OF MONEY'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Trade History */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          {closedTrades.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No completed trades yet. Simulated trades will settle here upon expiry.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2 px-2">Entry Time</th>
                  <th className="py-2 px-2">Pair</th>
                  <th className="py-2 px-2">Dir</th>
                  <th className="py-2 px-2">Entry</th>
                  <th className="py-2 px-2">Expiry Price</th>
                  <th className="py-2 px-2">Stake</th>
                  <th className="py-2 px-2">PnL</th>
                  <th className="py-2 px-2">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {closedTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-2 text-slate-400">{t.entryTimeStr}</td>
                    <td className="py-2.5 px-2 font-bold text-slate-200">{t.pair}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-300">
                      {formatPrice(t.pair, t.entryPrice)}
                    </td>
                    <td className="py-2.5 px-2 text-slate-300">
                      {t.closePrice ? formatPrice(t.pair, t.closePrice) : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{formatCurrency(t.amount)}</td>
                    <td
                      className={`py-2.5 px-2 font-bold ${
                        (t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {(t.pnl || 0) >= 0 ? '+' : ''}
                      {formatCurrency(t.pnl || 0)}
                    </td>
                    <td className="py-2.5 px-2">
                      {t.status === 'WON' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> WIN
                        </span>
                      )}
                      {t.status === 'LOST' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> LOSS
                        </span>
                      )}
                      {t.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <AlertOctagon className="w-3.5 h-3.5" /> DRIFT VOID
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Signal Audit Log */}
      {activeTab === 'signals' && (
        <div className="overflow-x-auto">
          {signals.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No historical signals generated yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2 px-2">Scheduled (WAT)</th>
                  <th className="py-2 px-2">Signal Format</th>
                  <th className="py-2 px-2">Horizon</th>
                  <th className="py-2 px-2">Up %</th>
                  <th className="py-2 px-2">Down %</th>
                  <th className="py-2 px-2">Confidence</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {signals.map((sig) => (
                  <tr key={sig.id} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-2 text-slate-300">{sig.scheduledTime}</td>
                    <td className="py-2.5 px-2 font-bold text-slate-100">
                      {sig.formattedSignal}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{sig.timeframe}</td>
                    <td className="py-2.5 px-2 text-emerald-400 font-semibold">
                      {(sig.probabilities.up * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-2 text-rose-400 font-semibold">
                      {(sig.probabilities.down * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-2 text-slate-300">
                      {(sig.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sig.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
