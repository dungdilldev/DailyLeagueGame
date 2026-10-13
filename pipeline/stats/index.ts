import { armor, attackDamage, attackRange, baseHealth, magicResist, moveSpeed } from './baseStats';
import { skinCount } from './skinCount';
import type { StatDefinition } from './types';

/** The single list of stats in the game. Adding a stat = one new definition + one line here. */
export const STAT_REGISTRY: readonly StatDefinition[] = [
  skinCount,
  baseHealth,
  armor,
  magicResist,
  attackDamage,
  attackRange,
  moveSpeed,
];
