import { LEAGUE_WIKI_SOURCE, type ChampionStat } from './types';

/**
 * Counts the patches a champion was changed in, taken from its wiki patch history. That includes
 * bug fixes, hotfixes and visual updates, so the question says "patch notes" rather than
 * "balance changes".
 */
export const patchCount: ChampionStat = {
  id: 'patchCount',
  label: 'Patches with changes',
  question: 'Which champion has appeared in the most patch notes?',
  source: LEAGUE_WIKI_SOURCE,
  extract: ({ patchCount: count }) => count,
};
