/**
 * Timezone and formatting utilities
 * Requirements:
 * - Africa/Lagos timezone
 * - 24-hour time display
 * - Precise pip and forex decimal formatting
 */

export const LAGOS_TIMEZONE = 'Africa/Lagos';

export function getLagosTime(date: Date | number = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
  timeString24h: string;
  timeStringWithSeconds: string;
  dateString: string;
} {
  const d = typeof date === 'number' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const hourPart = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutePart = parts.find((p) => p.type === 'minute')?.value || '00';
  const secondPart = parts.find((p) => p.type === 'second')?.value || '00';

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  return {
    hours: parseInt(hourPart, 10),
    minutes: parseInt(minutePart, 10),
    seconds: parseInt(secondPart, 10),
    timeString24h: `${hourPart}:${minutePart}`,
    timeStringWithSeconds: `${hourPart}:${minutePart}:${secondPart}`,
    dateString: dateFormatter.format(d),
  };
}

export function formatPrice(pair: string, price: number): string {
  if (pair.includes('JPY')) {
    return price.toFixed(3);
  }
  return price.toFixed(5);
}

/**
 * Format exact signal string required by spec:
 * TIME | ENTRY PRICE | UP/DOWN
 * Example: 14:30 | 1.08425 | UP
 */
export function formatSignalText(
  scheduledTime: string,
  entryPrice: number,
  pair: string,
  direction: 'UP' | 'DOWN' | 'NO TRADE'
): string {
  return `${scheduledTime} | ${formatPrice(pair, entryPrice)} | ${direction}`;
}

/**
 * Calculates drift in pips between reference price and current price
 */
export function calculateDriftPips(pair: string, referencePrice: number, currentPrice: number): number {
  const isJpy = pair.includes('JPY');
  const pipMultiplier = isJpy ? 100 : 10000;
  return Math.abs(currentPrice - referencePrice) * pipMultiplier;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
