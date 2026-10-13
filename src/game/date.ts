/** Formats a date as YYYY-MM-DD in UTC. The puzzle "day" is always defined in UTC. */
export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MS_PER_DAY = 24 * SECONDS_PER_HOUR * MS_PER_SECOND;

/** Returns the UTC date string `days` after `date` (YYYY-MM-DD in, YYYY-MM-DD out). */
export function addUtcDays(date: string, days: number): string {
  return formatUtcDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY));
}

/** Milliseconds from `now` until the next UTC midnight, when the next puzzle unlocks. */
export function msUntilNextUtcDay(now: Date): number {
  const tomorrow = addUtcDays(formatUtcDate(now), 1);
  return Date.parse(`${tomorrow}T00:00:00Z`) - now.getTime();
}

/** Formats a duration as HH:MM:SS, rounding up so the display never shows 00:00:00 early. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}
