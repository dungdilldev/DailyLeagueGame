import { addUtcDays } from './date';

/**
 * Number of consecutive completed days ending today. A streak stays alive while today is
 * still unplayed, so it only resets once a whole day has been missed.
 */
export function currentStreak(completedDates: readonly string[], today: string): number {
  const completed = new Set(completedDates);
  let day = completed.has(today) ? today : addUtcDays(today, -1);
  let streak = 0;
  while (completed.has(day)) {
    streak++;
    day = addUtcDays(day, -1);
  }
  return streak;
}
