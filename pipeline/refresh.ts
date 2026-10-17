import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ZodType } from 'zod';
import questionFile from '../data/questions.json';
import { resolveQuestions } from '../src/data/questions';
import {
  ChampionDataFileSchema,
  ItemDataFileSchema,
  QuestionFileSchema,
  type DataFile,
  type Entity,
} from '../src/data/schema';
import { formatUtcDate } from '../src/game/date';
import { buildChampions } from './buildChampions';
import { buildItems } from './buildItems';
import { selectItems } from './items/selectItems';
import { mergeSnapshots } from './snapshots';
import {
  fetchChampionDetail,
  fetchChampionSummaries,
  fetchItems,
  fetchJson,
  fetchLatestVersion,
} from './sources/dataDragon';
import { buildWikiLookup, fetchText, fetchWikiChampions } from './sources/leagueWiki';
import { fetchWikiItemData } from './sources/leagueWikiItems';
import { fetchPatchCounts } from './sources/leagueWikiPatchHistory';
import { CHAMPION_STATS, ITEM_STATS } from './stats';
import { toStatMeta, type ItemStatInput, type StatInput } from './stats/types';
import {
  findEntityProblems,
  findQuestionListProblems,
  MIN_CHAMPION_COUNT,
  MIN_ITEM_COUNT,
} from './validate/gameData';

const CHAMPIONS_PATH = path.resolve('public/data/champions.json');
const ITEMS_PATH = path.resolve('public/data/items.json');
const CONCURRENCY = 8;

/** Runs `task` over `items` with a bounded number of requests in flight, keeping input order. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Snapshots already published, or none if there is no usable file yet. */
async function readExistingSnapshots<T extends Entity>(
  filePath: string,
  schema: ZodType<DataFile<T>>,
): Promise<DataFile<T>['snapshots']> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    return [];
  }
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.warn(`${filePath} does not match the current format; starting fresh.`);
    return [];
  }
  return parsed.data.snapshots;
}

/** Writes via a temp file so a crash never leaves a half-written data file. */
async function writeJsonAtomically(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  // Compact on purpose: the browser downloads this file.
  await writeFile(tempPath, `${JSON.stringify(data)}\n`);
  await rename(tempPath, filePath);
}

async function main(): Promise<void> {
  const version = await fetchLatestVersion(fetchJson);
  console.log(`Data Dragon version ${version}`);

  const summaries = await fetchChampionSummaries(fetchJson, version);
  const findWikiChampion = buildWikiLookup(await fetchWikiChampions(fetchText));
  const patchCounts = await fetchPatchCounts(summaries.map((summary) => summary.name));
  const championInputs: StatInput[] = await mapWithConcurrency(
    summaries,
    CONCURRENCY,
    async (summary) => ({
      summary,
      detail: await fetchChampionDetail(fetchJson, version, summary.id),
      wiki: findWikiChampion(Number(summary.key), summary.id),
      patchCount: patchCounts.get(summary.name),
    }),
  );

  const wikiItems = await fetchWikiItemData();
  const itemInputs: ItemStatInput[] = selectItems(
    await fetchItems(fetchJson, version),
    wikiItems.items,
  ).map(({ item, wiki }) => ({ item, wiki, goldValues: wikiItems.goldValues }));

  const championStats = CHAMPION_STATS.map(toStatMeta);
  const itemStats = ITEM_STATS.map(toStatMeta);
  const champions = buildChampions(championInputs, version, CHAMPION_STATS);
  const items = buildItems(itemInputs, version, ITEM_STATS);
  const questions = resolveQuestions(QuestionFileSchema.parse(questionFile).questions, {
    champion: championStats,
    item: itemStats,
  });
  const problems = [
    ...findEntityProblems('champion', champions, CHAMPION_STATS, MIN_CHAMPION_COUNT),
    ...findEntityProblems('item', items, ITEM_STATS, MIN_ITEM_COUNT),
    ...findQuestionListProblems(questions, {
      champion: new Set(champions.map(({ id }) => id)),
      item: new Set(items.map(({ id }) => id)),
    }),
  ];
  if (problems.length > 0) {
    throw new Error(`Refusing to write invalid data:\n- ${problems.join('\n- ')}`);
  }

  const today = formatUtcDate(new Date());
  const championFile = ChampionDataFileSchema.parse({
    stats: championStats,
    snapshots: mergeSnapshots(
      await readExistingSnapshots(CHAMPIONS_PATH, ChampionDataFileSchema),
      { patch: version, entities: champions },
      today,
    ),
  });
  const itemFile = ItemDataFileSchema.parse({
    stats: itemStats,
    snapshots: mergeSnapshots(
      await readExistingSnapshots(ITEMS_PATH, ItemDataFileSchema),
      { patch: version, entities: items },
      today,
    ),
  });

  await writeJsonAtomically(CHAMPIONS_PATH, championFile);
  await writeJsonAtomically(ITEMS_PATH, itemFile);
  for (const [name, file] of [
    ['champions', championFile],
    ['items', itemFile],
  ] as const) {
    for (const snapshot of file.snapshots) {
      console.log(
        `${name} snapshot patch ${snapshot.patch}: ${String(snapshot.entities.length)} entries, effective from ${snapshot.effectiveFrom}`,
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
