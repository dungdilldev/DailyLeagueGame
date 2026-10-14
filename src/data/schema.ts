import { z } from 'zod';

/** Stat ids are defined by the stat registry in `pipeline/stats`; the client treats them as opaque. */
export type StatId = string;

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** What a question is about: each round compares champions with champions, or items with items. */
export const StatSubjectSchema = z.enum(['champion', 'item']);
export type StatSubject = z.infer<typeof StatSubjectSchema>;

/** How a stat's number is shown to the player. */
export const StatFormatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('number') }),
  /** A percentage such as 103.6, shown with a % sign. */
  z.object({ kind: z.literal('percent') }),
  /** The number is a count of days since `epoch` (ISO date), shown as a calendar date. */
  z.object({ kind: z.literal('date'), epoch: IsoDateSchema }),
]);
export type StatFormat = z.infer<typeof StatFormatSchema>;

/** Everything the game needs to know about a stat besides the values themselves. */
export const StatMetaSchema = z.object({
  id: z.string().min(1),
  /** Whether the stat describes champions or items. */
  subject: StatSubjectSchema.default('champion'),
  /** Shown to the player, e.g. "Base health". */
  label: z.string().min(1),
  /** The full question; a higher value is always the right answer. */
  question: z.string().min(1),
  format: StatFormatSchema,
  /** Where the values came from, so wrong-looking numbers can be traced. */
  source: z.string().min(1),
});
export type StatMeta = z.infer<typeof StatMetaSchema>;

/** Something the player can pick: a champion or an item. */
const EntityFields = {
  /** Stable id: Data Dragon's champion id ("MissFortune") or item id ("3031"). */
  id: z.string().min(1),
  name: z.string().min(1),
  iconUrl: z.url(),
  /** Stat id -> value. A stat is absent when its source has no value for this entity. */
  stats: z.record(z.string(), z.number().nonnegative()),
};
export type Entity = {
  id: string;
  name: string;
  iconUrl: string;
  stats: Record<string, number>;
};

export const ChampionSchema = z.object({
  ...EntityFields,
  title: z.string(),
  /** Data Dragon "tags": champion classes such as Mage or Assassin (not lanes). */
  classes: z.array(z.string()),
});
export type Champion = z.infer<typeof ChampionSchema>;

export const ItemSchema = z.object(EntityFields);
export type Item = z.infer<typeof ItemSchema>;

/**
 * Game data as of one patch. A snapshot is used for puzzle days from `effectiveFrom` on,
 * so a data update never changes the puzzle of a day that has already started.
 */
export const SnapshotSchema = z.object({
  /** Game patch the data was taken from, e.g. "16.20.1". */
  patch: z.string().min(1),
  /** First UTC day (YYYY-MM-DD) whose puzzle is generated from this snapshot. */
  effectiveFrom: IsoDateSchema,
  champions: z.array(ChampionSchema),
  /** Absent in snapshots published before items were added. */
  items: z.array(ItemSchema).default([]),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

/** The published data file: stat definitions plus the current (and any upcoming) snapshot. */
export const GameDataFileSchema = z.object({
  stats: z.array(StatMetaSchema).min(1),
  snapshots: z.array(SnapshotSchema).min(1),
});
export type GameDataFile = z.infer<typeof GameDataFileSchema>;
