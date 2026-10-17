import { formatStatValue } from './statFormat';
import type { Round } from './puzzle';

/** The text to show for a champion's value in a round, or undefined if it is not in the round. */
export function displayValue(round: Round, championId: string): string | undefined {
  const value = round.values[championId];
  return value === undefined || !round.format ? undefined : formatStatValue(round.format, value);
}
