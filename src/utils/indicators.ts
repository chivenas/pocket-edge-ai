import { Candlestick, TechnicalIndicators } from '../types/trading';

/**
 * Calculates EMA for a series of values
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const emaVal = data[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(emaVal);
  }
  return emaArray;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's smoothing
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macdLine: number; signalLine: number; histogram: number } {
  if (closes.length < slowPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLineSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLineSeries.push(fastEMA[i] - slowEMA[i]);
  }

  const signalLineSeries = calculateEMA(macdLineSeries, signalPeriod);
  const latestMacd = macdLineSeries[macdLineSeries.length - 1];
  const latestSignal = signalLineSeries[signalLineSeries.length - 1];

  return {
    macdLine: latestMacd,
    signalLine: latestSignal,
    histogram: latestMacd - latestSignal,
  };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2
): { upper: number; middle: number; lower: number } {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 1;
    return { upper: last * 1.002, middle: last, lower: last * 0.998 };
  }

  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: mean + stdDev * multiplier,
    middle: mean,
    lower: mean - stdDev * multiplier,
  };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candlestick[], period = 14): number {
  if (candles.length < 2) return 0.0005;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }

  if (trs.length < period) {
    return trs.reduce((a, b) => a + b, 0) / trs.length;
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

/**
 * Calculates Average Directional Index (ADX)
 */
export function calculateADX(candles: Candlestick[], period = 14): number {
  if (candles.length < period * 2) return 25.0; // Baseline neutral value

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);

    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    if (upMove > downMove && upMove > 0) {
      plusDMs.push(upMove);
    } else {
      plusDMs.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDMs.push(downMove);
    } else {
      minusDMs.push(0);
    }
  }

  // Smooth TR, +DM, -DM
  let smoothTR = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = period; i < trs.length; i++) {
    smoothTR = smoothTR - smoothTR / period + trs[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDMs[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDMs[i];

    const plusDI = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
    const minusDI = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;

    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    dxList.push(dx);
  }

  if (dxList.length === 0) return 25.0;
  return dxList.slice(-period).reduce((a, b) => a + b, 0) / Math.min(dxList.length, period);
}

/**
 * Calculates all 6 required indicators for a set of candles
 */
export function calculateAllIndicators(candles: Candlestick[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);

  const latestEma9 = ema9.length > 0 ? ema9[ema9.length - 1] : closes[closes.length - 1] || 1;
  const latestEma21 = ema21.length > 0 ? ema21[ema21.length - 1] : closes[closes.length - 1] || 1;
  const latestEma50 = ema50.length > 0 ? ema50[ema50.length - 1] : closes[closes.length - 1] || 1;

  return {
    ema9: latestEma9,
    ema21: latestEma21,
    ema50: latestEma50,
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes, 12, 26, 9),
    bollingerBands: calculateBollingerBands(closes, 20, 2),
    atr: calculateATR(candles, 14),
    adx: calculateADX(candles, 14),
  };
}
