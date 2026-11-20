import { LEAGUE_WIKI_SOURCE, type ChampionStat } from './types';

/**
 * Patches a champion was changed in, from the wiki patch history. Shown with "patch changes per
 * year" so players can see what the rate comes from.
 */
export const patchCount: ChampionStat = {
  id: 'patchCount',
  label: 'Patch changes',
  source: LEAGUE_WIKI_SOURCE,
  extract: ({ patchCount: count }) => count,
};
