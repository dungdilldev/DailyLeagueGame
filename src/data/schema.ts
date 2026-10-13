import { z } from 'zod';

/** Stat ids are defined by the stat registry in `pipeline/stats`; the client treats them as opaque. */
export type StatId = string;

export const StatValueSchema = z.object({
  value: z.number().nonnegative(),
  /** Where the number came from, so wrong-looking values can be traced. */
  source: z.string().min(1),
});
export type StatValue = z.infer<typeof StatValueSchema>;

export const ChampionSchema = z.object({
  /** Data Dragon id, e.g. "MissFortune". Stable across patches, used for image URLs. */
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string(),
  /** Data Dragon "tags": champion classes such as Mage or Assassin (not lanes). */
  classes: z.array(z.string()),
  iconUrl: z.url(),
  stats: z.record(z.string(), StatValueSchema),
});
export type Champion = z.infer<typeof ChampionSchema>;

export const ChampionsFileSchema = z.object({
  /** Game patch the data was taken from, e.g. "16.20.1". */
  patch: z.string().min(1),
  champions: z.array(ChampionSchema),
});
export type ChampionsFile = z.infer<typeof ChampionsFileSchema>;
