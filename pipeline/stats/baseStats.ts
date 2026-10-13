import { DATA_DRAGON_SOURCE, type StatDefinition } from './types';
import type { ChampionDetail } from '../sources/dataDragon';

type BaseStatKey = keyof ChampionDetail['stats'];

/** Defines a stat that is a direct copy of one of Data Dragon's base stat fields. */
function baseStat(id: string, label: string, key: BaseStatKey): StatDefinition {
  return { id, label, source: DATA_DRAGON_SOURCE, extract: (detail) => detail.stats[key] };
}

export const baseHealth = baseStat('baseHealth', 'Base health', 'hp');
export const armor = baseStat('armor', 'Base armor', 'armor');
export const magicResist = baseStat('magicResist', 'Base magic resistance', 'spellblock');
export const attackDamage = baseStat('attackDamage', 'Base attack damage', 'attackdamage');
export const attackRange = baseStat('attackRange', 'Attack range', 'attackrange');
export const moveSpeed = baseStat('moveSpeed', 'Movement speed', 'movespeed');
