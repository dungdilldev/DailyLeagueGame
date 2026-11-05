import type { GameMode } from '../game/gameMode';

/**
 * Each mode has its own page, named after the mode (`lore.html`), so search engines see one page
 * with its own title and text per mode.
 */
export function modePageHref(mode: GameMode): string {
  return `${mode}.html`;
}
