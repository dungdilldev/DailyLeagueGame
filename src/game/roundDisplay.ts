import type { Round } from '../data/puzzleSchema';

/** The question for a round. Puzzles published before questions were stored get a derived one. */
export function roundQuestion(round: Round): string {
  return round.question ?? `Which champion has the highest ${round.statLabel.toLowerCase()}?`;
}

/** The value to show for a champion: the pre-formatted text if the puzzle has it, else the number. */
export function displayValue(round: Round, championId: string): string | undefined {
  const formatted = round.displayValues?.[championId];
  if (formatted !== undefined) return formatted;
  const value = round.values[championId];
  return value === undefined ? undefined : value.toLocaleString('en-US');
}
