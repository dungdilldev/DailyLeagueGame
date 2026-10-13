/** Formats a date as YYYY-MM-DD in UTC. The puzzle "day" is always defined in UTC. */
export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
