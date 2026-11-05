import { z } from 'zod';
import imageFile from '../../data/esportsImages.json';
import { imageSlug } from './imageSlug';

/** Image file names on Leaguepedia (lol.fandom.com), by team, league or player name. */
const ImageNamesSchema = z.record(z.string(), z.string().min(1));

export const EsportsImageFileSchema = z.strictObject({
  leagues: ImageNamesSchema,
  teams: ImageNamesSchema,
  players: ImageNamesSchema,
});
export type EsportsImageFile = z.infer<typeof EsportsImageFileSchema>;
export type EsportsImageKind = keyof EsportsImageFile;

/** Hand-written like the players file and bundled into the app, so it is checked once on load. */
export const esportsImages: EsportsImageFile = EsportsImageFileSchema.parse(imageFile);

/** Where the downloaded images live below the site root; `npm run images:download` fills it. */
export const ESPORTS_IMAGE_DIRECTORY = 'images/esports';

/** The downloaded file's path below `ESPORTS_IMAGE_DIRECTORY`, so names need no escaping. */
export function esportsImagePath(kind: EsportsImageKind, name: string): string {
  return `${kind}/${imageSlug(name)}.webp`;
}
