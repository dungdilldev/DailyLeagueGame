import type { ChampionDetail } from '../sources/dataDragon';
import { DATA_DRAGON_SOURCE, type ChampionStat } from './types';

const DEFAULT_SKIN_NUMBER = 0;
/** Chromas and prestige editions are listed as "Name (Variant)" and are not counted as skins. */
const VARIANT_NAME_PATTERN = /\)$/;

/** A skin a player can buy: not the default one, and not a chroma or prestige edition. */
export function isPurchasableSkin(skin: ChampionDetail['skins'][number]): boolean {
  return skin.num !== DEFAULT_SKIN_NUMBER && !VARIANT_NAME_PATTERN.test(skin.name);
}

export function countSkins(detail: ChampionDetail): number {
  return detail.skins.filter(isPurchasableSkin).length;
}

export const skinCount: ChampionStat = {
  id: 'skinCount',
  label: 'Number of skins',
  source: DATA_DRAGON_SOURCE,
  extract: ({ detail }) => countSkins(detail),
};
