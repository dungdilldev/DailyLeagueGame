/** Formats a date as YYYY-MM-DD in UTC. The puzzle "day" is always defined in UTC. */
export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Returns the UTC date string `days` after `date` (YYYY-MM-DD in, YYYY-MM-DD out). */
export function addUtcDays(date: string, days: number): string {
  return formatUtcDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY));
}
