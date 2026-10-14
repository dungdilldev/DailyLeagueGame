import { addUtcDays, isValidUtcDate } from './date';

/** How many days back a player can go. Data snapshots are kept long enough to match. */
export const ARCHIVE_DAYS = 7;

export function earliestPlayableDate(today: string): string {
  return addUtcDays(today, -ARCHIVE_DAYS);
}

/**
 * The puzzle day to show: the requested one if it is a real date inside the archive window,
 * otherwise today. Anything else (garbage, future dates, too old) quietly falls back to today.
 */
export function resolvePuzzleDate(requested: string | null | undefined, today: string): string {
  if (!requested || !isValidUtcDate(requested)) return today;
  // ISO dates compare correctly as plain strings.
  const inWindow = requested >= earliestPlayableDate(today) && requested <= today;
  return inWindow ? requested : today;
}
