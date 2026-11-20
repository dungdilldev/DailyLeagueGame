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

type Tier = Exclude<QuestionDifficulty, 'variable'>;

/**
 * The difficulties each round accepts, in play order, parallel to `ROUND_GAP_BANDS`. Rounds 2
 * and 4 take two tiers, so medium questions get three rounds instead of one: with one round each,
 * a medium question came up a quarter as often as an easy one (lore has 84 medium, 40 easy).
 */
export const ROUND_TIERS: readonly (readonly Tier[])[] = [
  ['easy'],
  ['easy', 'medium'],
  ['medium'],
  ['medium', 'hard'],
  ['hard'],
];

/** Whether a question of this difficulty may be asked in the round with this index. */
export function fitsRound(difficulty: QuestionDifficulty, roundIndex: number): boolean {
  return (
    difficulty === 'variable' || (ROUND_TIERS[roundIndex] ?? []).some((tier) => tier === difficulty)
  );
}

const TIER_ORDER: readonly Tier[] = ['easy', 'medium', 'hard'];

/**
 * How far a question's difficulty is from a round's tier: 0 if it fits. Used when a small pool
 * (one category) has nothing that fits a round, to take the nearest instead of ending the day.
 */
export function tierDistance(difficulty: QuestionDifficulty, roundIndex: number): number {
  const tiers = ROUND_TIERS[roundIndex];
  if (difficulty === 'variable' || !tiers) return 0;
  return Math.min(
    ...tiers.map((tier) => Math.abs(TIER_ORDER.indexOf(difficulty) - TIER_ORDER.indexOf(tier))),
  );
}

export const ROUNDS_PER_DAY = ROUND_GAP_BANDS.length;

/**
 * How much a subcategory's size raises its chance to be tried early: its weight is
 * size ** exponent. 0 would give every subcategory the same share however many questions it has,
 * so a lone question repeated every few days; 1 would let a big one (lore's `nations`, 36
 * questions) take over the day. The square root sits between.
 */
export const SLOT_SIZE_WEIGHT_EXPONENT = 0.5;

/** Retries with a derived seed if a day cannot be built (still fully deterministic). */
export const MAX_PUZZLE_ATTEMPTS = 20;
