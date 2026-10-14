import { z } from 'zod';
import { parseLuaTable } from './luaTable';
import { fetchText, type TextFetcher } from './leagueWiki';

const WIKI_RAW_BASE = 'https://wiki.leagueoflegends.com/en-us';
const ITEM_DATA_URL = `${WIKI_RAW_BASE}/Module:ItemData/data?action=raw`;
const GOLD_VALUE_URL = `${WIKI_RAW_BASE}/Module:Gold_value/data?action=raw`;
/** A real response has several hundred items; far fewer means the format changed. */
const MIN_WIKI_ITEMS = 100;
const MAX_REFERENCE_DEPTH = 5;
/** Marks "same as that other item": `["ad"] = "=>Manamune"`. */
const REFERENCE_PREFIX = '=>';

/** An item as the wiki describes it, with "same as that item" references resolved. */
export interface WikiItem {
  /** Numeric item id; equals Data Dragon's item id. */
  id: number;
  name: string;
  /** Wiki categories, e.g. "Legendary", "Boots", "Starter". */
  types: string[];
  /** Stat key (the wiki's own short names such as "ad", "ah") -> amount. */
  stats: Record<string, number>;
  /** Stat keys whose value is not a plain number (e.g. adaptive force), so totals would be wrong. */
  unresolvedStats: string[];
}

export interface WikiItemData {
  items: WikiItem[];
  /** Stat key -> gold value of one point of that stat, from the wiki's gold efficiency table. */
  goldValues: Record<string, number>;
}

const RawItemSchema = z.object({
  id: z.number().int(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});
type RawItem = z.infer<typeof RawItemSchema>;

const RawItemsSchema = z.record(z.string(), RawItemSchema);
const RawGoldValuesSchema = z.record(z.string(), z.object({ val: z.number() }));

function asList(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : [value].flat();
}

/** Follows "=>Other item" references for a stat. Undefined if it never reaches a number. */
function resolveStat(
  raw: Readonly<Record<string, RawItem>>,
  itemName: string,
  statKey: string,
  depth = 0,
): number | undefined {
  const value = raw[itemName]?.stats?.[statKey];
  if (typeof value === 'number') return value;
  if (
    typeof value === 'string' &&
    value.startsWith(REFERENCE_PREFIX) &&
    depth < MAX_REFERENCE_DEPTH
  ) {
    return resolveStat(raw, value.slice(REFERENCE_PREFIX.length), statKey, depth + 1);
  }
  return undefined;
}

function resolveTypes(
  raw: Readonly<Record<string, RawItem>>,
  itemName: string,
  depth = 0,
): string[] {
  const types = asList(raw[itemName]?.type);
  const reference = types.find((type) => type.startsWith(REFERENCE_PREFIX));
  if (reference === undefined || depth >= MAX_REFERENCE_DEPTH) return types;
  return resolveTypes(raw, reference.slice(REFERENCE_PREFIX.length), depth + 1);
}

/** Parses the wiki's item and gold value Lua modules. Throws if the format changed. */
export function parseWikiItemData(itemLua: string, goldLua: string): WikiItemData {
  const raw = RawItemsSchema.parse(parseLuaTable(itemLua));
  const goldValues = Object.fromEntries(
    Object.entries(RawGoldValuesSchema.parse(parseLuaTable(goldLua))).map(([key, { val }]) => [
      key,
      val,
    ]),
  );

  const items = Object.entries(raw).map(([name, item]): WikiItem => {
    const stats: Record<string, number> = {};
    const unresolvedStats: string[] = [];
    for (const key of Object.keys(item.stats ?? {})) {
      const value = resolveStat(raw, name, key);
      if (value === undefined) unresolvedStats.push(key);
      else stats[key] = value;
    }
    return { id: item.id, name, types: resolveTypes(raw, name), stats, unresolvedStats };
  });

  if (items.length < MIN_WIKI_ITEMS) {
    throw new Error(`Only ${String(items.length)} wiki items parsed; the format probably changed`);
  }
  return { items, goldValues };
}

export async function fetchWikiItemData(fetcher: TextFetcher = fetchText): Promise<WikiItemData> {
  const [itemLua, goldLua] = [await fetcher(ITEM_DATA_URL), await fetcher(GOLD_VALUE_URL)];
  return parseWikiItemData(itemLua, goldLua);
}
