import { fetchText, type TextFetcher } from './leagueWiki';
import { fetchWikiPages } from './leagueWikiPages';

const HISTORY_SUFFIX = '/Patch history';

/**
 * Each patch with changes is a line like ";[[V26.19]]" or ";[[V25.24#Hotfix|V25.24]] - Hotfix"
 * in the champion's "Patch history" page.
 */
const PATCH_ENTRY = /^;\s*\[\[/gm;

/** Number of patch entries in the text of a "Patch history" page. */
export function countPatchEntries(pageText: string): number {
  return pageText.match(PATCH_ENTRY)?.length ?? 0;
}

/**
 * Fetches the number of patch entries for each champion name. Champions without a patch history
 * page are left out of the result.
 */
export async function fetchPatchCounts(
  championNames: readonly string[],
  fetcher: TextFetcher = fetchText,
): Promise<Map<string, number>> {
  const pages = await fetchWikiPages(
    championNames.map((name) => `${name}${HISTORY_SUFFIX}`),
    fetcher,
  );
  const counts = new Map<string, number>();
  for (const name of championNames) {
    const text = pages.get(`${name}${HISTORY_SUFFIX}`);
    if (text !== undefined) counts.set(name, countPatchEntries(text));
  }
  return counts;
}
