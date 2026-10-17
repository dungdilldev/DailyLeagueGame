import type { ChampionDetail } from '../sources/dataDragon';
import { DATA_DRAGON_SOURCE, type ChampionStat } from './types';

const DEFAULT_SKIN_NUMBER = 0;
/** Chromas and prestige editions are listed as "Name (Variant)" and are not counted as skins. */
const VARIANT_NAME_PATTERN = /\)$/;

/** Skins a player can buy: not the default one, and not chromas or prestige editions. */
export function countSkins(detail: ChampionDetail): number {
  return detail.skins.filter(
    (skin) => skin.num !== DEFAULT_SKIN_NUMBER && !VARIANT_NAME_PATTERN.test(skin.name),
  ).length;
}

export const skinCount: ChampionStat = {
  id: 'skinCount',
  label: 'Number of skins',
  source: DATA_DRAGON_SOURCE,
  extract: ({ detail }) => countSkins(detail),
};
