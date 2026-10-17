export type ForexPair = 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'AUD/USD' | 'USD/CAD' | 'EUR/GBP';

export type Timeframe = '1m' | '3m' | '5m';

export type SignalDirection = 'UP' | 'DOWN' | 'NO TRADE';

export interface Candlestick {
  time: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema9: number;
  ema21: number;
  ema50: number;
  rsi: number; // 0 - 100
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  adx: number; // 0 - 100
}

export interface SignalForecast {
  id: string;
  pair: ForexPair;
  timeframe: Timeframe;
  scheduledTime: string; // "HH:mm" Lagos time
  scheduledTimestamp: number;
  notificationTime: string; // 2 minutes before entry
  notificationTimestamp: number;
  referenceEntryPrice: number;
  direction: SignalDirection;
  probabilities: {
    up: number; // 0 - 1
    down: number; // 0 - 1
    noTrade: number; // 0 - 1
  };
  confidence: number; // Calibrated confidence 0 - 1
  driftTolerancePips: number; // Default 1.5 pips
  reasoning: string[];
  status: 'PENDING_ALERT' | 'ALERT_SENT' | 'TRIGGERED' | 'CANCELLED_DRIFT' | 'EXPIRED';
  actualEntryPrice?: number;
  expiryTimestamp: number;
  expiryPrice?: number;
  outcome?: 'WIN' | 'LOSS' | 'VOID' | 'PENDING';
  formattedSignal: string; // e.g. "14:30 | 1.08425 | UP"
  createdAt: number;
}

export interface PaperTrade {
  id: string;
  userId: string;
  pair: ForexPair;
  direction: 'UP' | 'DOWN';
  entryPrice: number;
  referencePrice: number;
  driftPips: number;
  amount: number;
  payoutPercentage: number; // e.g. 85%
  entryTime: number; // Unix ms
  entryTimeStr: string; // HH:mm:ss WAT
  expiryTime: number; // Unix ms
  expiryTimeStr: string; // HH:mm:ss WAT
  timeframe: Timeframe;
  status: 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';
  closePrice?: number;
  pnl?: number;
  sourceSignalId?: string;
  notes?: string;
}

export interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage 0 - 100
  simulatedBalance: number;
  initialBalance: number;
  netProfit: number;
  profitFactor: number;
  averageDriftPips: number;
  cancelledTradesCount: number;
}

export interface MarketTicker {
  pair: ForexPair;
  bid: number;
  ask: number;
  mid: number;
  high24h: number;
  low24h: number;
  change24h: number;
  spreadPips: number;
  lastUpdated: number; // ms
  isStale: boolean;
  source: string;
}
