import { z } from 'zod';

export const CHAMPIONS_PER_ROUND = 4;

export const RoundSchema = z.object({
  statId: z.string().min(1),
  /** Shown to the player, e.g. "Base health". Copied here so the client needs no stat registry. */
  statLabel: z.string().min(1),
  /**
   * The full question shown to the player. Optional only because puzzles published before it
   * existed lack it; the client falls back to a question built from the label.
   */
  question: z.string().min(1).optional(),
  /** Display order; the answer is not always in the same position. */
  championIds: z.array(z.string()).length(CHAMPIONS_PER_ROUND),
  /** The champion with the highest value. */
  answerId: z.string().min(1),
  /** Snapshot of every shown champion's value, revealed after answering. */
  values: z.record(z.string(), z.number()),
  /** Pre-formatted values for stats that are not plain numbers (e.g. dates); keyed like `values`. */
  displayValues: z.record(z.string(), z.string()).optional(),
});
export type Round = z.infer<typeof RoundSchema>;

export const PuzzleSchema = z.object({
  /** UTC day this puzzle belongs to, YYYY-MM-DD. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Patch of the data snapshot the values come from. */
  patch: z.string().min(1),
  rounds: z.array(RoundSchema).min(1),
});
export type Puzzle = z.infer<typeof PuzzleSchema>;
