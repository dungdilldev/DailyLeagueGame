import { perYear } from './perYear';
import { releaseDate } from './releaseDate';
import { countSkins, skinCount } from './skinCount';
import { DATA_DRAGON_SOURCE, LEAGUE_WIKI_SOURCE, type ChampionStat } from './types';

/** Skins per year since release, so old champions do not win just by having had more time. */
export const skinsPerYear: ChampionStat = {
  id: 'skinsPerYear',
  label: 'Skins per year',
  source: `${DATA_DRAGON_SOURCE} + ${LEAGUE_WIKI_SOURCE}`,
  unit: 'skins per year',
  details: [
    { stat: skinCount, label: 'Skins' },
    { stat: releaseDate, label: 'Released' },
  ],
  extract: ({ detail, wiki, referenceDate }) =>
    perYear(countSkins(detail), wiki?.releaseDate, referenceDate),
};
