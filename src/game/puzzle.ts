import type { OptionSubject, StatFormat } from '../data/schema';

export const OPTIONS_PER_ROUND = 4;

export interface Round {
  /** Id of the question template this round was built from. */
  questionId: string;
  /** Whether the options are champions or items. */
  subject: OptionSubject;
  /** Short name for the results, e.g. "Base health" or "Marksmen". */
  statLabel: string;
  question: string;
  /** How to display the values after the player has answered; absent when there are none. */
  format?: StatFormat;
  /** Ids of the options (champions or items), in display order; the answer is not always first. */
  optionIds: string[];
  /** The right option: the one with the highest value, or the one from a pick question's correct list. */
  answerId: string;
  /**
   * Something shown with the question that the player must recognise: the answer's team logo.
   * Absent for most rounds.
   */
  clue?: 'teamLogo';
  /** Every option's value, revealed after answering. Empty for a pick question. */
  values: Record<string, number>;
  /** The question's `answer` text, shown once the player has answered. Absent for most rounds. */
  explanation?: string;
}

export interface Puzzle {
  /** UTC day this puzzle belongs to, YYYY-MM-DD. */
  date: string;
  rounds: Round[];
}
