import {
  armor,
  attackDamage,
  attackRange,
  attackSpeed,
  baseHealth,
  healthPerLevel,
  healthRegen,
  magicResist,
  moveSpeed,
} from './baseStats';
import {
  itemAbilityHaste,
  itemAbilityPower,
  itemArmor,
  itemAttackDamage,
  itemCost,
  itemGoldEfficiency,
  itemHealth,
  itemMagicResist,
} from './itemStats';
import { patchesPerYear } from './patchesPerYear';
import { releaseDate } from './releaseDate';
import { skinCount } from './skinCount';
import { skinsPerYear } from './skinsPerYear';
import type { ChampionStat, ItemStat } from './types';

/** Every stat stored in champions.json. Adding one = one new definition + one line here. */
export const CHAMPION_STATS: readonly ChampionStat[] = [
  skinCount,
  skinsPerYear,
  releaseDate,
  baseHealth,
  healthPerLevel,
  healthRegen,
  armor,
  magicResist,
  attackDamage,
  attackSpeed,
  attackRange,
  moveSpeed,
  patchesPerYear,
];

/** Every stat stored in items.json. */
export const ITEM_STATS: readonly ItemStat[] = [
  itemCost,
  itemGoldEfficiency,
  itemAttackDamage,
  itemAbilityPower,
  itemHealth,
  itemArmor,
  itemMagicResist,
  itemAbilityHaste,
];
