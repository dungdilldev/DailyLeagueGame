import type { ChampionDetail, ChampionSummary } from '../../pipeline/sources/dataDragon';
import type { WikiChampion } from '../../pipeline/sources/leagueWiki';
import type { StatInput } from '../../pipeline/stats/types';

export function makeSummary(id: string, overrides: Partial<ChampionSummary> = {}): ChampionSummary {
  return {
    id,
    key: '1',
    name: id,
    title: `the ${id}`,
    tags: ['Mage'],
    image: { full: `${id}.png` },
    ...overrides,
  };
}

export function makeDetail(id: string, overrides: Partial<ChampionDetail> = {}): ChampionDetail {
  return {
    id,
    skins: [{ num: 0, name: 'default' }],
    stats: {
      hp: 600,
      hpperlevel: 100,
      hpregen: 3,
      armor: 20,
      spellblock: 30,
      attackrange: 550,
      movespeed: 330,
      attackdamage: 53,
      attackspeed: 0.65,
    },
    ...overrides,
  };
}

export function makeWiki(id: string, overrides: Partial<WikiChampion> = {}): WikiChampion {
  return { key: 1, apiName: id, releaseDate: '2013-06-13', ...overrides };
}

export function makeInput(id: string, overrides: Partial<StatInput> = {}): StatInput {
  return {
    summary: makeSummary(id),
    detail: makeDetail(id),
    wiki: makeWiki(id),
    ...overrides,
  };
}
