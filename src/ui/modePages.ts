import type { GameMode } from '../game/gameMode';

/** The address parameter that opens an earlier day from the archive. */
export const DATE_PARAM = 'date';

/**
 * Each mode has its own page, named after the mode (`lore.html`), so search engines see one page
 * with its own title and text per mode. `date` opens an earlier day there.
 */
export function modePageHref(mode: GameMode, date?: string): string {
  const page = `${mode}.html`;
  return date === undefined ? page : `${page}?${DATE_PARAM}=${date}`;
}
