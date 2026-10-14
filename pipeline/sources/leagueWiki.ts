import { z } from 'zod';

/**
 * League of Legends Wiki (CC BY-SA). Its champion data lives in a Lua module that the wiki
 * serves as plain text, which is the data the wiki's own pages are built from.
 */
const CHAMPION_DATA_URL =
  'https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data?action=raw';
/** The wiki asks API clients to identify themselves. */
const USER_AGENT = 'DailyLeague/0.1 (hobby quiz; daily data refresh)';
/** A real response has ~170 champions; far fewer means the format changed and parsing broke. */
const MIN_WIKI_CHAMPIONS = 100;

/** Fetches a URL as text. Injected so tests never touch the network. */
export type TextFetcher = (url: string) => Promise<string>;

export const fetchText: TextFetcher = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
  return response.text();
};

const WikiChampionSchema = z.object({
  /** Numeric champion id; equals the "key" field in Data Dragon. */
  key: z.number().int(),
  /** Equals the Data Dragon champion id (e.g. "MonkeyKing"); fallback when keys disagree. */
  apiName: z.string().min(1),
  /** ISO date, e.g. "2013-06-13". Absent when the wiki has no usable date. */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type WikiChampion = z.infer<typeof WikiChampionSchema>;

const WikiChampionsSchema = z.array(WikiChampionSchema).min(MIN_WIKI_CHAMPIONS);

// Champion entries are the two-space-indented keys of the module's returned table. Their own
// fields are indented 3-5 characters (mostly four spaces, but some entries mix in tabs), while
// nested tables go deeper; the indent range avoids picking up nested tables.
const ENTRY_START = /^ {2}\["[^"]+"\]\s*=\s*\{\s*$/gm;
const KEY_FIELD = /^[ \t]{3,5}\["id"\]\s*=\s*(\d+)/m;
const API_NAME_FIELD = /^[ \t]{3,5}\["apiname"\]\s*=\s*"([^"]+)"/m;
const DATE_FIELD = /^[ \t]{3,5}\["date"\]\s*=\s*"(\d{4}-\d{2}-\d{2})"/m;

/** Extracts the fields we use from the wiki's Lua module text. Throws if the format changed. */
export function parseWikiChampions(lua: string): WikiChampion[] {
  const starts = [...lua.matchAll(ENTRY_START)];
  const entries = starts.map((start, i) => {
    const block = lua.slice(start.index, starts[i + 1]?.index ?? lua.length);
    const key = KEY_FIELD.exec(block)?.[1];
    return {
      key: key === undefined ? undefined : Number(key),
      apiName: API_NAME_FIELD.exec(block)?.[1],
      releaseDate: DATE_FIELD.exec(block)?.[1],
    };
  });
  return WikiChampionsSchema.parse(entries);
}

export async function fetchWikiChampions(fetcher: TextFetcher): Promise<WikiChampion[]> {
  return parseWikiChampions(await fetcher(CHAMPION_DATA_URL));
}

/** Looks up a champion by numeric key, then by API name (covers entries whose ids disagree). */
export function buildWikiLookup(
  champions: readonly WikiChampion[],
): (key: number, apiName: string) => WikiChampion | undefined {
  const byKey = new Map(champions.map((champion) => [champion.key, champion]));
  const byApiName = new Map(champions.map((champion) => [champion.apiName, champion]));
  return (key, apiName) => byKey.get(key) ?? byApiName.get(apiName);
}
