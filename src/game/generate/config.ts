import type { QuestionDifficulty } from '../../data/schema';

/**
 * Allowed relative gap between the best and second-best value in a round:
 * (best - second) / best. A narrow band means a close call, i.e. a harder question.
 */
export interface GapBand {
  minRatio: number;
  maxRatio: number;
}

/** One entry per round, in play order: each round is harder than the one before. */
export const ROUND_GAP_BANDS: readonly GapBand[] = [
  { minRatio: 0.3, maxRatio: 1 },
  { minRatio: 0.18, maxRatio: 0.3 },
  { minRatio: 0.1, maxRatio: 0.18 },
  { minRatio: 0.05, maxRatio: 0.1 },
  { minRatio: 0.02, maxRatio: 0.05 },
];

/** How hard each round is, in play order, parallel to `ROUND_GAP_BANDS`. */
export const ROUND_TIERS: readonly Exclude<QuestionDifficulty, 'variable'>[] = [
  'easy',
  'easy',
  'medium',
  'hard',
  'hard',
];

/** Whether a question of this difficulty may be asked in the round with this index. */
export function fitsRound(difficulty: QuestionDifficulty, roundIndex: number): boolean {
  return difficulty === 'variable' || difficulty === ROUND_TIERS[roundIndex];
}

const TIER_ORDER: readonly QuestionDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * How far a question's difficulty is from a round's tier: 0 if it fits. Used when a small pool
 * (one category) has nothing that fits a round, to take the nearest instead of ending the day.
 */
export function tierDistance(difficulty: QuestionDifficulty, roundIndex: number): number {
  const tier = ROUND_TIERS[roundIndex];
  if (difficulty === 'variable' || !tier) return 0;
  return Math.abs(TIER_ORDER.indexOf(difficulty) - TIER_ORDER.indexOf(tier));
}

export const ROUNDS_PER_DAY = ROUND_GAP_BANDS.length;

/** Retries with a derived seed if a day cannot be built (still fully deterministic). */
export const MAX_PUZZLE_ATTEMPTS = 20;
