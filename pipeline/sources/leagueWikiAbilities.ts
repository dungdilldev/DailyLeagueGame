import { fetchText, type TextFetcher } from './leagueWiki';
import { fetchWikiPages } from './leagueWikiPages';

/** The four abilities a champion levels up, in Data Dragon's order. Passives have no ranks. */
export const ABILITY_SLOTS = ['Q', 'W', 'E', 'R'] as const;
export type AbilitySlot = (typeof ABILITY_SLOTS)[number];

/**
 * The wiki keeps each ability's numbers in a data template, e.g. "Template:Data Ahri/Q" (a
 * redirect to "Template:Data Ahri/Orb of Deception"). The champion pages are built from them.
 */
function templateTitle(championName: string, slot: AbilitySlot): string {
  return `Template:Data ${championName}/${slot}`;
}

/**
 * Fetches the data template text of every champion's Q, W, E and R, keyed by champion name and
 * then slot. A template the wiki does not have yet is left out.
 */
export async function fetchAbilityTemplates(
  championNames: readonly string[],
  fetcher: TextFetcher = fetchText,
): Promise<Map<string, Partial<Record<AbilitySlot, string>>>> {
  const pages = await fetchWikiPages(
    championNames.flatMap((name) => ABILITY_SLOTS.map((slot) => templateTitle(name, slot))),
    fetcher,
  );
  return new Map(
    championNames.map((name) => {
      const entries = ABILITY_SLOTS.flatMap((slot) => {
        const text = pages.get(templateTitle(name, slot));
        return text === undefined ? [] : [[slot, text] as const];
      });
      return [name, Object.fromEntries(entries)];
    }),
  );
}
