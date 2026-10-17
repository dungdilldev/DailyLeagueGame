import type { StatFormat, StatSubject } from '../data/schema';

export const OPTIONS_PER_ROUND = 4;

export interface Round {
  /** Id of the question template this round was built from. */
  questionId: string;
  /** Whether the options are champions or items. */
  subject: StatSubject;
  /** Shown to the player, e.g. "Base health". */
  statLabel: string;
  question: string;
  /** How to display the values after the player has answered. */
  format: StatFormat;
  /** Ids of the options (champions or items), in display order; the answer is not always first. */
  optionIds: string[];
  /** The option with the highest value. */
  answerId: string;
  /** Every option's value, revealed after answering. */
  values: Record<string, number>;
}

export interface Puzzle {
  /** UTC day this puzzle belongs to, YYYY-MM-DD. */
  date: string;
  rounds: Round[];
}
