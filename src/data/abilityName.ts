/** Joins whose ability it is and the ability's own name: "Ahri Q · Orb of Deception". */
export const ABILITY_NAME_SEPARATOR = ' · ';

export function joinAbilityName(owner: string, abilityName: string): string {
  return `${owner}${ABILITY_NAME_SEPARATOR}${abilityName}`;
}

/**
 * The lines a name is shown on: an ability's owner and its own name on two lines, any other name
 * on one. Splits at the first separator only, so an ability name containing one stays whole.
 */
export function displayNameLines(name: string): readonly string[] {
  const index = name.indexOf(ABILITY_NAME_SEPARATOR);
  if (index <= 0) return [name];
  const rest = name.slice(index + ABILITY_NAME_SEPARATOR.length);
  return rest ? [name.slice(0, index), rest] : [name];
}
