import type { ChampionDetail, ChampionSummary } from '../sources/dataDragon';
import { ABILITY_SLOTS, type AbilitySlot } from '../sources/leagueWikiAbilities';
import type { AbilityStatInput } from '../stats/types';
import { parseAbility } from './parseAbility';

/** Data Dragon names both forms of a transforming ability: "To the Skies! / Shock Blast". */
const FORM_SEPARATOR = /\s+[/|]\s+/;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Whether the wiki ability is the one Data Dragon has in that slot. The wiki template of a
 * transforming champion describes the first form, which is also the form of Data Dragon's icon.
 */
export function isSameAbility(wikiName: string, dataDragonName: string): boolean {
  const wanted = normalizeName(wikiName);
  return dataDragonName.split(FORM_SEPARATOR).some((form) => normalizeName(form) === wanted);
}

/**
 * One champion's Q, W, E and R, with Data Dragon's icon and the wiki's numbers. An ability whose
 * wiki template is missing or names a different ability than Data Dragon is left out, so a
 * card never shows one ability's icon with another's numbers.
 */
export function collectAbilities(
  summary: ChampionSummary,
  detail: ChampionDetail,
  templates: Partial<Record<AbilitySlot, string>>,
): AbilityStatInput[] {
  return ABILITY_SLOTS.flatMap((slot, index) => {
    const template = templates[slot];
    const spell = detail.spells[index];
    const wiki = template === undefined ? undefined : parseAbility(template);
    if (!wiki || !spell || !isSameAbility(wiki.name, spell.name)) return [];
    return [{ id: `${summary.id}${slot}`, championName: summary.name, slot, spell, wiki }];
  });
}
