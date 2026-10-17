import { perYear } from './perYear';
import { countSkins } from './skinCount';
import { DATA_DRAGON_SOURCE, LEAGUE_WIKI_SOURCE, type ChampionStat } from './types';

/** Skins per year since release, so old champions do not win just by having had more time. */
export const skinsPerYear: ChampionStat = {
  id: 'skinsPerYear',
  label: 'Skins per year',
  source: `${DATA_DRAGON_SOURCE} + ${LEAGUE_WIKI_SOURCE}`,
  extract: ({ detail, wiki, referenceDate }) =>
    perYear(countSkins(detail), wiki?.releaseDate, referenceDate),
};
