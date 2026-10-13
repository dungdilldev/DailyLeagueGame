import type { ChampionDetail, ChampionSummary } from '../../pipeline/sources/dataDragon';

export function makeSummary(id: string, overrides: Partial<ChampionSummary> = {}): ChampionSummary {
  return {
    id,
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
      armor: 20,
      spellblock: 30,
      attackrange: 550,
      movespeed: 330,
      attackdamage: 53,
    },
    ...overrides,
  };
}
