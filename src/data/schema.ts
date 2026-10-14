import { z } from 'zod';

/** Stat ids are defined by the stat registry in `pipeline/stats`; the client treats them as opaque. */
export type StatId = string;

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** How a stat's number is shown to the player. */
export const StatFormatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('number') }),
  /** The number is a count of days since `epoch` (ISO date), shown as a calendar date. */
  z.object({ kind: z.literal('date'), epoch: IsoDateSchema }),
]);
export type StatFormat = z.infer<typeof StatFormatSchema>;

/** Everything the game needs to know about a stat besides the values themselves. */
export const StatMetaSchema = z.object({
  id: z.string().min(1),
  /** Shown to the player, e.g. "Base health". */
  label: z.string().min(1),
  /** The full question; a higher value is always the right answer. */
  question: z.string().min(1),
  format: StatFormatSchema,
  /** Where the values came from, so wrong-looking numbers can be traced. */
  source: z.string().min(1),
});
export type StatMeta = z.infer<typeof StatMetaSchema>;

export const ChampionSchema = z.object({
  /** Data Dragon id, e.g. "MissFortune". Stable across patches, used for image URLs. */
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string(),
  /** Data Dragon "tags": champion classes such as Mage or Assassin (not lanes). */
  classes: z.array(z.string()),
  iconUrl: z.url(),
  /** Stat id -> value. A stat is absent when its source has no value for this champion. */
  stats: z.record(z.string(), z.number().nonnegative()),
});
export type Champion = z.infer<typeof ChampionSchema>;

/**
 * Champion data as of one patch. A snapshot is used for puzzle days from `effectiveFrom` on,
 * so a data update never changes the puzzle of a day that has already started.
 */
export const SnapshotSchema = z.object({
  /** Game patch the data was taken from, e.g. "16.20.1". */
  patch: z.string().min(1),
  /** First UTC day (YYYY-MM-DD) whose puzzle is generated from this snapshot. */
  effectiveFrom: IsoDateSchema,
  champions: z.array(ChampionSchema),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

/** The published data file: stat definitions plus the current (and any upcoming) snapshot. */
export const GameDataFileSchema = z.object({
  stats: z.array(StatMetaSchema).min(1),
  snapshots: z.array(SnapshotSchema).min(1),
});
export type GameDataFile = z.infer<typeof GameDataFileSchema>;
