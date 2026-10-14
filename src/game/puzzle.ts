import type { StatFormat } from '../data/schema';

export const CHAMPIONS_PER_ROUND = 4;

export interface Round {
  statId: string;
  /** Shown to the player, e.g. "Base health". */
  statLabel: string;
  question: string;
  /** How to display the values after the player has answered. */
  format: StatFormat;
  /** Display order; the answer is not always in the same position. */
  championIds: string[];
  /** The champion with the highest value. */
  answerId: string;
  /** Every shown champion's value, revealed after answering. */
  values: Record<string, number>;
}

export interface Puzzle {
  /** UTC day this puzzle belongs to, YYYY-MM-DD. */
  date: string;
  /** Patch of the data snapshot the values come from. */
  patch: string;
  rounds: Round[];
}
