import { z } from 'zod';

const BASE_URL = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'en_US';
const MAX_ATTEMPTS = 3;

/** Fetches and parses JSON. Injected so tests never touch the network. */
export type JsonFetcher = (url: string) => Promise<unknown>;

export const fetchJson: JsonFetcher = async (url) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
      return (await response.json()) as unknown;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Failed to fetch ${url} after ${String(MAX_ATTEMPTS)} attempts`, {
    cause: lastError,
  });
};

const VersionsSchema = z.array(z.string()).min(1);

const ChampionSummarySchema = z.object({
  id: z.string(),
  /** Numeric champion id as a string; matches the wiki's numeric id. */
  key: z.string(),
  name: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  image: z.object({ full: z.string() }),
});
export type ChampionSummary = z.infer<typeof ChampionSummarySchema>;

const SummaryFileSchema = z.object({ data: z.record(z.string(), ChampionSummarySchema) });

/** Per-champion detail: only the fields stat modules read. */
const ChampionDetailSchema = z.object({
  id: z.string(),
  skins: z.array(z.object({ num: z.number(), name: z.string() })),
  stats: z.object({
    hp: z.number(),
    hpperlevel: z.number(),
    hpregen: z.number(),
    armor: z.number(),
    spellblock: z.number(),
    attackrange: z.number(),
    movespeed: z.number(),
    attackdamage: z.number(),
    attackspeed: z.number(),
  }),
});
export type ChampionDetail = z.infer<typeof ChampionDetailSchema>;

const DetailFileSchema = z.object({ data: z.record(z.string(), ChampionDetailSchema) });

export async function fetchLatestVersion(fetcher: JsonFetcher): Promise<string> {
  const versions = VersionsSchema.parse(await fetcher(`${BASE_URL}/api/versions.json`));
  // The list is newest-first and the schema guarantees at least one entry.
  return versions[0] as string;
}

export async function fetchChampionSummaries(
  fetcher: JsonFetcher,
  version: string,
): Promise<ChampionSummary[]> {
  const raw = await fetcher(`${BASE_URL}/cdn/${version}/data/${LOCALE}/champion.json`);
  return Object.values(SummaryFileSchema.parse(raw).data);
}

export async function fetchChampionDetail(
  fetcher: JsonFetcher,
  version: string,
  championId: string,
): Promise<ChampionDetail> {
  const raw = await fetcher(
    `${BASE_URL}/cdn/${version}/data/${LOCALE}/champion/${championId}.json`,
  );
  const detail = DetailFileSchema.parse(raw).data[championId];
  if (!detail) throw new Error(`Champion detail for "${championId}" missing from response`);
  return detail;
}

export function championIconUrl(version: string, summary: ChampionSummary): string {
  return `${BASE_URL}/cdn/${version}/img/champion/${summary.image.full}`;
}

const ItemSchema = z.object({
  name: z.string(),
  gold: z.object({ total: z.number(), purchasable: z.boolean() }),
  /** Map id -> available on that map; "11" is Summoner's Rift. */
  maps: z.record(z.string(), z.boolean()),
  /** Items this one is an ingredient of; absent for completed items. */
  into: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.object({ full: z.string() }),
});
const ItemFileSchema = z.object({ data: z.record(z.string(), ItemSchema) });

export interface DataDragonItem extends z.infer<typeof ItemSchema> {
  /** Item id as a string, e.g. "3031". */
  id: string;
}

export async function fetchItems(fetcher: JsonFetcher, version: string): Promise<DataDragonItem[]> {
  const raw = await fetcher(`${BASE_URL}/cdn/${version}/data/${LOCALE}/item.json`);
  return Object.entries(ItemFileSchema.parse(raw).data).map(([id, item]) => ({ id, ...item }));
}

export function itemIconUrl(version: string, item: DataDragonItem): string {
  return `${BASE_URL}/cdn/${version}/img/item/${item.image.full}`;
}
