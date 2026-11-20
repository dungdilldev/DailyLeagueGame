import { formatStatValue } from './statFormat';
import type { Round } from './puzzle';

/** The text to show for a champion's value in a round, or undefined if it is not in the round. */
export function displayValue(round: Round, championId: string): string | undefined {
  const value = round.values[championId];
  return value === undefined || !round.format ? undefined : formatStatValue(round.format, value);
}

/** The detail lines of an option, e.g. "Skins: 11" and "Released: Jun 13, 2013". */
export function displayDetails(round: Round, optionId: string): string[] {
  return (round.details ?? []).flatMap((detail) => {
    const value = detail.values[optionId];
    return value === undefined ? [] : [`${detail.label}: ${formatStatValue(detail.format, value)}`];
  });
}
