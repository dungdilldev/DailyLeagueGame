import { perYear } from './perYear';
import { LEAGUE_WIKI_SOURCE, type ChampionStat } from './types';

/**
 * Patches a champion was changed in, per year since release, taken from the wiki patch history.
 * That includes bug fixes, hotfixes and visual updates, not only balance changes, so the
 * question says "patch changes".
 */
export const patchesPerYear: ChampionStat = {
  id: 'patchesPerYear',
  label: 'Patch changes per year',
  source: LEAGUE_WIKI_SOURCE,
  extract: ({ patchCount, wiki, referenceDate }) =>
    perYear(patchCount, wiki?.releaseDate, referenceDate),
};
