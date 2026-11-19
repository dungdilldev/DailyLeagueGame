import imageFile from '../../data/esportsImages.json';
import { imageSlug } from './imageSlug';

/** Image file names on Leaguepedia (lol.fandom.com), by team, league or player name. */
export interface EsportsImageFile {
  leagues: Record<string, string>;
  teams: Record<string, string>;
  players: Record<string, string>;
}
export type EsportsImageKind = keyof EsportsImageFile;

/**
 * Hand-written like the players file and bundled into the app. Not parsed here, so the browser
 * loads no Zod: `EsportsImageFileSchema` checks it in the tests, which gate every deploy.
 */
export const esportsImages: EsportsImageFile = imageFile;

/** Where the downloaded images live below the site root; `npm run images:download` fills it. */
export const ESPORTS_IMAGE_DIRECTORY = 'images/esports';

/** The downloaded file's path below `ESPORTS_IMAGE_DIRECTORY`, so names need no escaping. */
export function esportsImagePath(kind: EsportsImageKind, name: string): string {
  return `${kind}/${imageSlug(name)}.webp`;
}
