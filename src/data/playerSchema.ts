import { z } from 'zod';

/** The international tournaments whose titles are recorded. */
export const PlayerTitleEventSchema = z.enum(['Worlds', 'MSI']);
export type PlayerTitleEvent = z.infer<typeof PlayerTitleEventSchema>;

/** The region a player is best known for, which is not always where they were born. */
export const PlayerRegionSchema = z.enum(['Korea', 'China', 'Europe', 'North America']);
export type PlayerRegion = z.infer<typeof PlayerRegionSchema>;

const PlayerTitleSchema = z.strictObject({
  event: PlayerTitleEventSchema,
  year: z.number().int().min(2011),
});

const hasUniqueValues = (values: readonly string[]) => new Set(values).size === values.length;

/** One professional player, hand-written in `data/players.json`. */
const PlayerSchema = z
  .strictObject({
    /** In-game name; also the id, and the name a `text` question option would show. */
    name: z.string().min(1),
    region: PlayerRegionSchema,
    /** Titles at Worlds and MSI only; regional titles are not recorded. */
    titles: z.array(PlayerTitleSchema),
    /** Professional teams, oldest first; an organisation that was renamed appears under its current name. */
    teams: z.array(z.string().min(1)).min(1),
    /** Only for players with a well-known epithet. */
    nickname: z.string().min(1).optional(),
  })
  .refine(({ teams }) => hasUniqueValues(teams), { message: 'A team may be listed only once' })
  .refine(
    ({ titles }) => hasUniqueValues(titles.map(({ event, year }) => `${event}${String(year)}`)),
    {
      message: 'A title may be listed only once',
    },
  );
export type Player = z.infer<typeof PlayerSchema>;

export const PlayerFileSchema = z
  .object({ players: z.array(PlayerSchema).min(1) })
  .refine(({ players }) => hasUniqueValues(players.map(({ name }) => name)), {
    message: 'Player names must be unique',
  });
export type PlayerFile = z.infer<typeof PlayerFileSchema>;
