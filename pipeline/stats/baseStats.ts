import type { StatIcon } from '../../src/data/statIcons';
import type { ChampionDetail } from '../sources/dataDragon';
import { DATA_DRAGON_SOURCE, type ChampionStat } from './types';

type BaseStatKey = keyof ChampionDetail['stats'];

/** Defines a stat that is a direct copy of one of Data Dragon's base stat fields. */
function baseStat(id: string, label: string, key: BaseStatKey, unitIcon: StatIcon): ChampionStat {
  return {
    id,
    label,
    source: DATA_DRAGON_SOURCE,
    unitIcon,
    extract: ({ detail }) => detail.stats[key],
  };
}

export const baseHealth = baseStat('baseHealth', 'Base health', 'hp', 'health');
export const healthPerLevel = baseStat(
  'healthPerLevel',
  'Health gained per level',
  'hpperlevel',
  'health',
);
export const healthRegen = baseStat(
  'healthRegen',
  'Base health regeneration',
  'hpregen',
  'healthRegen',
);
export const armor = baseStat('armor', 'Base armor', 'armor', 'armor');
export const magicResist = baseStat(
  'magicResist',
  'Base magic resistance',
  'spellblock',
  'magicResist',
);
export const attackDamage = baseStat(
  'attackDamage',
  'Base attack damage',
  'attackdamage',
  'attackDamage',
);
export const attackSpeed = baseStat(
  'attackSpeed',
  'Base attack speed',
  'attackspeed',
  'attackSpeed',
);
export const attackRange = baseStat('attackRange', 'Attack range', 'attackrange', 'attackRange');
export const moveSpeed = baseStat('moveSpeed', 'Movement speed', 'movespeed', 'moveSpeed');
