import type { StatIcon } from '../../src/data/statIcons';
import type { RatioKind } from '../abilities/parseAbility';
import { LEAGUE_WIKI_SOURCE, type AbilityStat, type AbilityStatInput } from './types';

/**
 * Ability stats, all at max rank, from the wiki's ability data templates. Each stat only covers
 * the abilities it can read without doubt, so its `minCoverage` is the share of abilities that
 * normally have it; far fewer means the wiki's format changed.
 */

const ULTIMATE_SLOT = 'R';
const isUltimate = ({ slot }: AbilityStatInput) => slot === ULTIMATE_SLOT;
/** Ultimates have much bigger numbers, so damage and cooldown compare like with like. */
const onlyBasic =
  (value: (input: AbilityStatInput) => number | undefined) => (input: AbilityStatInput) =>
    isUltimate(input) ? undefined : value(input);
const onlyUltimate =
  (value: (input: AbilityStatInput) => number | undefined) => (input: AbilityStatInput) =>
    isUltimate(input) ? value(input) : undefined;

const baseDamage = ({ wiki }: AbilityStatInput) => wiki.damage?.base;
const cooldown = ({ wiki }: AbilityStatInput) => wiki.cooldown;

function ratioStat(
  id: string,
  label: string,
  kind: RatioKind,
  minCoverage: number,
  unitIcon: StatIcon,
): AbilityStat {
  return {
    id,
    label,
    source: LEAGUE_WIKI_SOURCE,
    format: { kind: 'percent' },
    minCoverage,
    unitIcon,
    extract: ({ wiki }) => wiki.damage?.ratios[kind],
  };
}

export const basicAbilityDamage: AbilityStat = {
  id: 'basicAbilityDamage',
  label: 'Base damage (basic ability)',
  source: LEAGUE_WIKI_SOURCE,
  minCoverage: 0.15,
  extract: onlyBasic(baseDamage),
};

export const ultimateDamage: AbilityStat = {
  id: 'ultimateDamage',
  label: 'Base damage (ultimate)',
  source: LEAGUE_WIKI_SOURCE,
  minCoverage: 0.04,
  extract: onlyUltimate(baseDamage),
};

export const abilityApRatio = ratioStat('abilityApRatio', 'AP ratio', 'ap', 0.15, 'abilityPower');
export const abilityBonusAdRatio = ratioStat(
  'abilityBonusAdRatio',
  'Bonus AD ratio',
  'bonusAd',
  0.05,
  'attackDamage',
);
/** Few abilities scale with total AD, so the floor of 8 values matters more than this share. */
export const abilityAdRatio = ratioStat(
  'abilityAdRatio',
  'Total AD ratio',
  'ad',
  0.01,
  'attackDamage',
);

export const basicAbilityCooldown: AbilityStat = {
  id: 'basicAbilityCooldown',
  label: 'Cooldown (basic ability)',
  source: LEAGUE_WIKI_SOURCE,
  minCoverage: 0.5,
  unitIcon: 'cooldown',
  extract: onlyBasic(cooldown),
};

export const ultimateCooldown: AbilityStat = {
  id: 'ultimateCooldown',
  label: 'Cooldown (ultimate)',
  source: LEAGUE_WIKI_SOURCE,
  minCoverage: 0.15,
  unitIcon: 'cooldown',
  extract: onlyUltimate(cooldown),
};

export const abilityManaCost: AbilityStat = {
  id: 'abilityManaCost',
  label: 'Mana cost',
  source: LEAGUE_WIKI_SOURCE,
  minCoverage: 0.5,
  unitIcon: 'mana',
  extract: ({ wiki }) => wiki.manaCost,
};
