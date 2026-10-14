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
import { patchCount } from './patchCount';
import { releaseDate } from './releaseDate';
import { skinCount } from './skinCount';
import type { StatDefinition } from './types';

/** The single list of stats in the game. Adding a stat = one new definition + one line here. */
export const STAT_REGISTRY: readonly StatDefinition[] = [
  skinCount,
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
  patchCount,
  itemCost,
  itemGoldEfficiency,
  itemAttackDamage,
  itemAbilityPower,
  itemHealth,
  itemArmor,
  itemMagicResist,
  itemAbilityHaste,
];
