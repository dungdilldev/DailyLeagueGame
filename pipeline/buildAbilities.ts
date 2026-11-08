import { joinAbilityName } from '../src/data/abilityName';
import type { Ability } from '../src/data/schema';
import { iconPath } from './icons/iconPaths';
import type { AbilityStat, AbilityStatInput } from './stats/types';

/** "Ahri Q · Orb of Deception": the card has to say whose ability it is. */
export function abilityDisplayName({ championName, slot, wiki }: AbilityStatInput): string {
  return joinAbilityName(`${championName} ${slot}`, wiki.name);
}

export function buildAbility(input: AbilityStatInput, stats: readonly AbilityStat[]): Ability {
  const entries = stats.flatMap((stat) => {
    const value = stat.extract(input);
    return value === undefined ? [] : [[stat.id, value] as const];
  });
  return {
    id: input.id,
    name: abilityDisplayName(input),
    iconUrl: iconPath('abilities', input.id),
    stats: Object.fromEntries(entries),
  };
}

/**
 * Abilities without any stat (e.g. a passive-like Q with no damage, cost or cooldown) can never
 * be an option, so they are left out. Sorted by id so unchanged data gives an identical result.
 */
export function buildAbilities(
  inputs: readonly AbilityStatInput[],
  stats: readonly AbilityStat[],
): Ability[] {
  return inputs
    .map((input) => buildAbility(input, stats))
    .filter((ability) => Object.keys(ability.stats).length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}
