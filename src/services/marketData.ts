import { Candlestick, ForexPair, MarketTicker, Timeframe } from '../types/trading';

// Baseline reference prices for major pairs
const BASE_PRICES: Record<ForexPair, { price: number; pipDecimals: number }> = {
  'EUR/USD': { price: 1.08425, pipDecimals: 5 },
  'GBP/USD': { price: 1.29340, pipDecimals: 5 },
  'USD/JPY': { price: 154.620, pipDecimals: 3 },
  'AUD/USD': { price: 0.65480, pipDecimals: 5 },
  'USD/CAD': { price: 1.38210, pipDecimals: 5 },
  'EUR/GBP': { price: 0.83820, pipDecimals: 5 },
};

/**
 * Generates an initial historical array of realistic candlestick data for the given pair
 */
export function generateInitialCandles(
  pair: ForexPair,
  timeframe: Timeframe,
  count = 45
): Candlestick[] {
  const base = BASE_PRICES[pair] || { price: 1.08425, pipDecimals: 5 };
  const intervalMs = timeframe === '1m' ? 60000 : timeframe === '3m' ? 180000 : 300000;
  const now = Date.now();
  const startTime = now - count * intervalMs;

  const volatility = pair.includes('JPY') ? 0.08 : 0.00015;
  const candles: Candlestick[] = [];
  let currentClose = base.price;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalMs;
    const delta = (Math.random() - 0.49) * volatility;
    const open = currentClose;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.8);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.8);
    const volume = Math.floor(250 + Math.random() * 800);

    currentClose = close;
    candles.push({
      time,
      open: parseFloat(open.toFixed(base.pipDecimals)),
      high: parseFloat(high.toFixed(base.pipDecimals)),
      low: parseFloat(low.toFixed(base.pipDecimals)),
      close: parseFloat(close.toFixed(base.pipDecimals)),
      volume,
    });
  }

  return candles;
}

/**
 * Creates a MarketTicker object from the latest price
 */
export function createTicker(pair: ForexPair, currentPrice: number, isStale = false): MarketTicker {
  const isJpy = pair.includes('JPY');
  const spreadPips = isJpy ? 1.2 : 0.8;
  const spreadValue = spreadPips * (isJpy ? 0.01 : 0.0001);

  const bid = currentPrice - spreadValue / 2;
  const ask = currentPrice + spreadValue / 2;
  const range = currentPrice * 0.006;

  return {
    pair,
    bid,
    ask,
    mid: currentPrice,
    high24h: currentPrice + range * 0.65,
    low24h: currentPrice - range * 0.35,
    change24h: 0.18,
    spreadPips,
    lastUpdated: Date.now(),
    isStale,
    source: 'Interbank Aggregator',
  };
}
