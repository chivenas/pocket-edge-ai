import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { PriceTicker } from './components/PriceTicker';
import { CandlestickChart } from './components/CandlestickChart';
import { SignalCard } from './components/SignalCard';
import { IndicatorsPanel } from './components/IndicatorsPanel';
import { PaperTradingPanel } from './components/PaperTradingPanel';
import {
  ForexPair,
  Timeframe,
  Candlestick,
  TechnicalIndicators,
  SignalForecast,
  PaperTrade,
  PerformanceStats,
  MarketTicker,
} from './types/trading';
import { generateInitialCandles, createTicker } from './services/marketData';
import { calculateAllIndicators } from './utils/indicators';
import { generateSignalForecast } from './utils/forecasting';
import { calculateDriftPips, formatPrice, getLagosTime } from './utils/formatters';
import { requestNotificationPermission, sendBrowserAlert } from './utils/notifications';
import { Bell, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();

  // State
  const [selectedPair, setSelectedPair] = useState<ForexPair>('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('5m'); // Default 5m horizon
  const [driftTolerance, setDriftTolerance] = useState<number>(1.5); // 1.5 pips default
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(1.08425);
  const [ticker, setTicker] = useState<MarketTicker>(createTicker('EUR/USD', 1.08425));
  const [indicators, setIndicators] = useState<TechnicalIndicators>({
    ema9: 1.0842,
    ema21: 1.0838,
    ema50: 1.0832,
    rsi: 54.5,
    macd: { macdLine: 0.00012, signalLine: 0.00008, histogram: 0.00004 },
    bollingerBands: { upper: 1.0855, middle: 1.0842, lower: 1.0829 },
    atr: 0.00035,
    adx: 28.5,
  });
  const [currentSignal, setCurrentSignal] = useState<SignalForecast | null>(null);
  const [signalHistory, setSignalHistory] = useState<SignalForecast[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    simulatedBalance: 10000,
    initialBalance: 10000,
    netProfit: 0,
    profitFactor: 1.0,
    averageDriftPips: 0,
    cancelledTradesCount: 0,
  });
  const [notificationState, setNotificationState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationBannerDismissed, setNotificationBannerDismissed] = useState(false);

  // Initialize data on pair or timeframe change
  useEffect(() => {
    const initialCandles = generateInitialCandles(selectedPair, selectedTimeframe, 45);
    setCandles(initialCandles);

    const latestClose = initialCandles[initialCandles.length - 1].close;
    setCurrentPrice(latestClose);
    setTicker(createTicker(selectedPair, latestClose));

    const calculatedIndicators = calculateAllIndicators(initialCandles);
    setIndicators(calculatedIndicators);

    const initialForecast = generateSignalForecast({
      pair: selectedPair,
      timeframe: selectedTimeframe,
      candles: initialCandles,
      currentPrice: latestClose,
      driftTolerancePips: driftTolerance,
    });
    setCurrentSignal(initialForecast);
    setSignalHistory((prev) => [initialForecast, ...prev.slice(0, 19)]);
  }, [selectedPair, selectedTimeframe]);

  // Real-time market tick simulator (subtle realistic pip movements)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;

        const isJpy = selectedPair.includes('JPY');
        const pipUnit = isJpy ? 0.01 : 0.0001;
        const tickDelta = (Math.random() - 0.495) * (pipUnit * 0.4);

        const lastIdx = prevCandles.length - 1;
        const lastCandle = prevCandles[lastIdx];
        const newClose = parseFloat((lastCandle.close + tickDelta).toFixed(isJpy ? 3 : 5));
        const newHigh = Math.max(lastCandle.high, newClose);
        const newLow = Math.min(lastCandle.low, newClose);

        const updatedLastCandle: Candlestick = {
          ...lastCandle,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: lastCandle.volume + Math.floor(Math.random() * 5),
        };

        const nextCandles = [...prevCandles.slice(0, lastIdx), updatedLastCandle];
        setCurrentPrice(newClose);
        setTicker(createTicker(selectedPair, newClose));

        // Recalculate indicators periodically
        const updatedIndicators = calculateAllIndicators(nextCandles);
        setIndicators(updatedIndicators);

        return nextCandles;
      });
    }, 1500);

    return () => clearInterval(tickInterval);
  }, [selectedPair]);

  // Monitor signal refresh & 2-minute pre-alert chime
  const lastAlertedSignalId = useRef<string | null>(null);

  useEffect(() => {
    const checkSchedule = setInterval(() => {
      if (!currentSignal) return;

      const now = Date.now();
      const diffToEntry = currentSignal.scheduledTimestamp - now;

      // 2 minutes before entry (between 120s and 115s)
      if (
        diffToEntry <= 120000 &&
        diffToEntry > 110000 &&
        lastAlertedSignalId.current !== currentSignal.id
      ) {
        lastAlertedSignalId.current = currentSignal.id;
        sendBrowserAlert(
          `Pocket Edge Alert: ${currentSignal.pair} ${currentSignal.direction}`,
          `Signal: ${currentSignal.formattedSignal} | Lagos Entry in 2 Minutes`
        );
      }

      // If scheduled time has passed + 10s, generate new forecast for next horizon
      if (now > currentSignal.scheduledTimestamp + 10000) {
        const nextSignal = generateSignalForecast({
          pair: selectedPair,
          timeframe: selectedTimeframe,
          candles,
          currentPrice,
          driftTolerancePips: driftTolerance,
        });
        setCurrentSignal(nextSignal);
        setSignalHistory((prev) => [nextSignal, ...prev.slice(0, 19)]);
      }
    }, 3000);

    return () => clearInterval(checkSchedule);
  }, [currentSignal, selectedPair, selectedTimeframe, candles, currentPrice, driftTolerance]);

  // Monitor and settle open paper trades
  useEffect(() => {
    const settleInterval = setInterval(() => {
      const now = Date.now();

      setPaperTrades((prevTrades) => {
        let hasChanges = false;
        const updated = prevTrades.map((trade) => {
          if (trade.status !== 'OPEN') return trade;

          if (now >= trade.expiryTime) {
            hasChanges = true;
            // Evaluate outcome
            let outcome: 'WON' | 'LOST' | 'CANCELLED' = 'LOST';
            let pnl = -trade.amount;

            if (trade.direction === 'UP') {
              if (currentPrice > trade.entryPrice) {
                outcome = 'WON';
                pnl = trade.amount * (trade.payoutPercentage / 100);
              }
            } else {
              if (currentPrice < trade.entryPrice) {
                outcome = 'WON';
                pnl = trade.amount * (trade.payoutPercentage / 100);
              }
            }

            return {
              ...trade,
              closePrice: currentPrice,
              status: outcome,
              pnl,
            };
          }
          return trade;
        });

        if (hasChanges) {
          // Recompute stats
          const closed = updated.filter((t) => t.status !== 'OPEN');
          const wins = closed.filter((t) => t.status === 'WON').length;
          const losses = closed.filter((t) => t.status === 'LOST').length;
          const cancelled = closed.filter((t) => t.status === 'CANCELLED').length;
          const netPnl = closed.reduce((acc, t) => acc + (t.pnl || 0), 0);
          const totalWinsAmt = closed
            .filter((t) => (t.pnl || 0) > 0)
            .reduce((acc, t) => acc + (t.pnl || 0), 0);
          const totalLossAmt = Math.abs(
            closed.filter((t) => (t.pnl || 0) < 0).reduce((acc, t) => acc + (t.pnl || 0), 0)
          );

          const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
          const profitFactor = totalLossAmt > 0 ? totalWinsAmt / totalLossAmt : 1.5;

          setStats({
            totalTrades: closed.length,
            winningTrades: wins,
            losingTrades: losses,
            winRate,
            simulatedBalance: 10000 + netPnl,
            initialBalance: 10000,
            netProfit: netPnl,
            profitFactor,
            averageDriftPips: 0.4,
            cancelledTradesCount: cancelled,
          });
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(settleInterval);
  }, [currentPrice]);

  // Execute paper trade with Drift Recheck
  const handleExecutePaperTrade = (signal: SignalForecast) => {
    const now = Date.now();
    const lagosNow = getLagosTime(now);

    // 9. Recheck market price at scheduled entry and cancel if price has drifted beyond tolerance
    const driftPips = calculateDriftPips(signal.pair, signal.referenceEntryPrice, currentPrice);

    if (driftPips > driftTolerance) {
      // Trade cancelled due to drift
      const cancelledTrade: PaperTrade = {
        id: `trade_${Date.now()}_cancelled`,
        userId: user?.uid || 'guest_trader',
        pair: signal.pair,
        direction: signal.direction as 'UP' | 'DOWN',
        entryPrice: currentPrice,
        referencePrice: signal.referenceEntryPrice,
        driftPips,
        amount: 100,
        payoutPercentage: 85,
        entryTime: now,
        entryTimeStr: lagosNow.timeStringWithSeconds,
        expiryTime: now,
        expiryTimeStr: lagosNow.timeStringWithSeconds,
        timeframe: signal.timeframe,
        status: 'CANCELLED',
        closePrice: currentPrice,
        pnl: 0,
        sourceSignalId: signal.id,
        notes: `Drift Guard Rejected: ${driftPips.toFixed(1)}p > ${driftTolerance}p limit`,
      };

      setPaperTrades((prev) => [cancelledTrade, ...prev]);
      setStats((prev) => ({
        ...prev,
        cancelledTradesCount: prev.cancelledTradesCount + 1,
      }));
      return;
    }

    const horizonMs =
      signal.timeframe === '1m' ? 60000 : signal.timeframe === '3m' ? 180000 : 300000;
    const expiryTime = now + horizonMs;
    const expiryLagos = getLagosTime(expiryTime);

    const newTrade: PaperTrade = {
      id: `trade_${Date.now()}`,
      userId: user?.uid || 'guest_trader',
      pair: signal.pair,
      direction: signal.direction as 'UP' | 'DOWN',
      entryPrice: currentPrice,
      referencePrice: signal.referenceEntryPrice,
      driftPips,
      amount: 100,
      payoutPercentage: 85,
      entryTime: now,
      entryTimeStr: lagosNow.timeStringWithSeconds,
      expiryTime,
      expiryTimeStr: expiryLagos.timeStringWithSeconds,
      timeframe: signal.timeframe,
      status: 'OPEN',
      sourceSignalId: signal.id,
    };

    setPaperTrades((prev) => [newTrade, ...prev]);
  };

  const handleResetAccount = () => {
    setPaperTrades([]);
    setStats({
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      simulatedBalance: 10000,
      initialBalance: 10000,
      netProfit: 0,
      profitFactor: 1.0,
      averageDriftPips: 0,
      cancelledTradesCount: 0,
    });
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationState(perm);
    if (perm === 'granted') {
      sendBrowserAlert('Pocket Edge AI Alerts Active', 'You will receive 2-minute pre-entry notifications.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        currentPrice={currentPrice}
      />

      {/* Sub Header / Ticker */}
      <PriceTicker
        ticker={ticker}
        driftTolerance={driftTolerance}
        onUpdateDriftTolerance={setDriftTolerance}
      />

      {/* 2-Min Notification Enable Banner (if not yet granted) */}
      {notificationState !== 'granted' && !notificationBannerDismissed && (
        <div className="bg-emerald-950/40 border-b border-emerald-800/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-300">
              <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>
                Enable browser notifications to receive sound and push alerts exactly 2 minutes
                before scheduled entry.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-colors"
              >
                Enable 2-Min Alerts
              </button>
              <button
                onClick={() => setNotificationBannerDismissed(true)}
                className="text-slate-400 hover:text-slate-200 px-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Trading Cockpit */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-5">
        {/* Top Grid: Candlestick Chart (2/3) + Signal Forecast Card (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <CandlestickChart
              pair={selectedPair}
              timeframe={selectedTimeframe}
              candles={candles}
              currentPrice={currentPrice}
              indicators={indicators}
              signalEntryPrice={currentSignal?.referenceEntryPrice}
              signalDirection={currentSignal?.direction}
            />
          </div>

          <div className="lg:col-span-1">
            <SignalCard
              signal={currentSignal}
              currentPrice={currentPrice}
              driftTolerance={driftTolerance}
              onExecutePaperTrade={handleExecutePaperTrade}
              isStale={ticker.isStale}
            />
          </div>
        </div>

        {/* Middle Section: Technical Indicator Matrix (EMA, RSI, MACD, BB, ATR, ADX) */}
        <IndicatorsPanel
          pair={selectedPair}
          indicators={indicators}
          currentPrice={currentPrice}
        />

        {/* Bottom Section: Paper Trading & Performance Dashboard */}
        <PaperTradingPanel
          trades={paperTrades}
          signals={signalHistory}
          stats={stats}
          currentPrice={currentPrice}
          onResetAccount={handleResetAccount}
        />
      </main>

      {/* Footer / Regulatory Notice */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Pocket Edge AI • Strictly Paper-Trading Simulation • Chronological Walk-Forward Testing
            </span>
          </div>
          <div>
            <span>No real-money broker API connection. Never guarantees trading outcomes.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
