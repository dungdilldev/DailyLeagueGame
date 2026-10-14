import type { StatFormat } from '../data/schema';
import { addUtcDays } from './date';

const PERCENT_DECIMALS = 1;

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Turns a stat value into the text shown to the player. */
export function formatStatValue(format: StatFormat, value: number): string {
  if (format.kind === 'number') return value.toLocaleString('en-US');
  if (format.kind === 'percent') return `${value.toFixed(PERCENT_DECIMALS)}%`;
  return dateFormat.format(new Date(`${addUtcDays(format.epoch, value)}T00:00:00Z`));
}
