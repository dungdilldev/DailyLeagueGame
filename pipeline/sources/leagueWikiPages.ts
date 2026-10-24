import { z } from 'zod';
import { fetchText, type TextFetcher } from './leagueWiki';

const API_URL = 'https://wiki.leagueoflegends.com/en-us/api.php';
/** Pages whose full text is requested per call; keeps each response a manageable size. */
const BATCH_SIZE = 25;
const MAX_REDIRECT_HOPS = 3;

const PageSchema = z.object({
  title: z.string(),
  missing: z.boolean().optional(),
  revisions: z
    .array(z.object({ slots: z.object({ main: z.object({ content: z.string() }) }) }))
    .optional(),
});
const TitleMapSchema = z.array(z.object({ from: z.string(), to: z.string() })).optional();
const ResponseSchema = z.object({
  query: z.object({
    pages: z.array(PageSchema),
    normalized: TitleMapSchema,
    redirects: TitleMapSchema,
  }),
});

function buildUrl(titles: readonly string[]): string {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    titles: titles.join('|'),
  });
  return `${API_URL}?${query.toString()}`;
}

/** Follows the API's title normalisation and redirects from a requested title to its page. */
function finalTitle(
  requested: string,
  maps: readonly (ReadonlyMap<string, string> | undefined)[],
): string {
  let title = requested;
  for (const map of maps) title = map?.get(title) ?? title;
  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    const next = maps[1]?.get(title);
    if (next === undefined) break;
    title = next;
  }
  return title;
}

function toMap(
  entries: { from: string; to: string }[] | undefined,
): Map<string, string> | undefined {
  return entries && new Map(entries.map(({ from, to }) => [from, to]));
}

/**
 * Fetches the wikitext of each page title, following redirects. The result is keyed by the
 * title as requested; missing pages are left out. Uses a few batched API calls, not one per page.
 */
export async function fetchWikiPages(
  titles: readonly string[],
  fetcher: TextFetcher = fetchText,
): Promise<Map<string, string>> {
  const texts = new Map<string, string>();

  for (let start = 0; start < titles.length; start += BATCH_SIZE) {
    const batch = titles.slice(start, start + BATCH_SIZE);
    const response = ResponseSchema.parse(JSON.parse(await fetcher(buildUrl(batch))));
    const { pages, normalized, redirects } = response.query;
    const pagesByTitle = new Map(pages.map((page) => [page.title, page]));

    for (const requested of batch) {
      const page = pagesByTitle.get(finalTitle(requested, [toMap(normalized), toMap(redirects)]));
      const text = page?.revisions?.[0]?.slots.main.content;
      if (text !== undefined) texts.set(requested, text);
    }
  }
  return texts;
}
