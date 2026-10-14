import type {
  ChampionDetail,
  ChampionSummary,
  DataDragonItem,
} from '../../pipeline/sources/dataDragon';
import type { WikiChampion } from '../../pipeline/sources/leagueWiki';
import type { WikiItem } from '../../pipeline/sources/leagueWikiItems';
import type { ItemStatInput, StatInput } from '../../pipeline/stats/types';

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
    patchCount: 12,
    ...overrides,
  };
}

export function makeDataDragonItem(
  id: string,
  overrides: Partial<DataDragonItem> = {},
): DataDragonItem {
  return {
    id,
    name: `Item ${id}`,
    gold: { total: 3000, purchasable: true },
    maps: { '11': true },
    tags: [],
    image: { full: `${id}.png` },
    ...overrides,
  };
}

export function makeWikiItem(id: string, overrides: Partial<WikiItem> = {}): WikiItem {
  return {
    id: Number(id),
    name: `Item ${id}`,
    types: ['Legendary'],
    stats: { ad: 60, ah: 20 },
    unresolvedStats: [],
    ...overrides,
  };
}

export const GOLD_VALUES = { ad: 35, ap: 21.75, hp: 2.666667, armor: 20, mr: 20, ah: 50 };

export function makeItemInput(id: string, overrides: Partial<ItemStatInput> = {}): ItemStatInput {
  return {
    item: makeDataDragonItem(id),
    wiki: makeWikiItem(id),
    goldValues: GOLD_VALUES,
    ...overrides,
  };
}
