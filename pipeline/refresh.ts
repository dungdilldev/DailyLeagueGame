import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ZodType } from 'zod';
import playerFile from '../data/players.json';
import { PlayerFileSchema } from '../src/data/playerSchema';
import { parseQuestionFiles, QUESTION_FILES } from '../src/data/questionFiles';
import { resolveQuestions } from '../src/data/questions';
import {
  AbilityDataFileSchema,
  ChampionDataFileSchema,
  ItemDataFileSchema,
  type DataFile,
  type Entity,
  type StatMeta,
} from '../src/data/schema';
import { formatUtcDate } from '../src/game/date';
import { collectAbilities } from './abilities/collectAbilities';
import { buildAbilities } from './buildAbilities';
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
import { fetchAbilityTemplates } from './sources/leagueWikiAbilities';
import { fetchWikiItemData } from './sources/leagueWikiItems';
import { fetchPatchCounts } from './sources/leagueWikiPatchHistory';
import { ABILITY_STATS, CHAMPION_STATS, ITEM_STATS } from './stats';
import { withReferenceDate } from './stats/perYear';
import { toStatMeta, type ItemStatInput } from './stats/types';
import {
  findEntityProblems,
  findEsportsSkinProblems,
  findQuestionListProblems,
  MIN_ABILITY_COUNT,
  MIN_CHAMPION_COUNT,
  MIN_ITEM_COUNT,
} from './validate/gameData';

const CHAMPIONS_PATH = path.resolve('public/data/champions.json');
const ITEMS_PATH = path.resolve('public/data/items.json');
const ABILITIES_PATH = path.resolve('public/data/abilities.json');
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

/** A data file with the freshly built entities folded into its published snapshots. */
async function updatedDataFile<T extends Entity>(
  filePath: string,
  schema: ZodType<DataFile<T>>,
  stats: StatMeta[],
  entities: T[],
  { version, today }: { version: string; today: string },
): Promise<DataFile<T>> {
  return schema.parse({
    stats,
    snapshots: mergeSnapshots(
      await readExistingSnapshots(filePath, schema),
      { patch: version, entities },
      today,
    ),
  });
}

async function main(): Promise<void> {
  const version = await fetchLatestVersion(fetchJson);
  console.log(`Data Dragon version ${version}`);

  const summaries = await fetchChampionSummaries(fetchJson, version);
  const findWikiChampion = buildWikiLookup(await fetchWikiChampions(fetchText));
  const patchCounts = await fetchPatchCounts(summaries.map((summary) => summary.name));
  const championInputs = await mapWithConcurrency(summaries, CONCURRENCY, async (summary) => ({
    summary,
    detail: await fetchChampionDetail(fetchJson, version, summary.id),
    wiki: findWikiChampion(Number(summary.key), summary.id),
    patchCount: patchCounts.get(summary.name),
  }));

  const wikiItems = await fetchWikiItemData();
  const itemInputs: ItemStatInput[] = selectItems(
    await fetchItems(fetchJson, version),
    wikiItems.items,
  ).map(({ item, wiki }) => ({ item, wiki, goldValues: wikiItems.goldValues }));

  const abilityTemplates = await fetchAbilityTemplates(summaries.map((summary) => summary.name));
  const abilityInputs = championInputs.flatMap(({ summary, detail }) =>
    collectAbilities(summary, detail, abilityTemplates.get(summary.name) ?? {}),
  );

  const championStats = CHAMPION_STATS.map(toStatMeta);
  const itemStats = ITEM_STATS.map(toStatMeta);
  const abilityStats = ABILITY_STATS.map(toStatMeta);
  const champions = buildChampions(withReferenceDate(championInputs), version, CHAMPION_STATS);
  const items = buildItems(itemInputs, version, ITEM_STATS);
  const abilities = buildAbilities(abilityInputs, version, ABILITY_STATS);
  const questions = resolveQuestions(
    parseQuestionFiles(QUESTION_FILES),
    { champion: championStats, item: itemStats, ability: abilityStats },
    PlayerFileSchema.parse(playerFile).players,
  );
  const problems = [
    ...findEntityProblems('champion', champions, CHAMPION_STATS, MIN_CHAMPION_COUNT),
    ...findEsportsSkinProblems(champions),
    ...findEntityProblems('item', items, ITEM_STATS, MIN_ITEM_COUNT),
    ...findEntityProblems('ability', abilities, ABILITY_STATS, MIN_ABILITY_COUNT),
    ...findQuestionListProblems(questions, {
      champion: new Set(champions.map(({ id }) => id)),
      item: new Set(items.map(({ id }) => id)),
      ability: new Set(abilities.map(({ id }) => id)),
    }),
  ];
  if (problems.length > 0) {
    throw new Error(`Refusing to write invalid data:\n- ${problems.join('\n- ')}`);
  }

  const today = formatUtcDate(new Date());
  const fresh = { version, today };
  const files = [
    {
      name: 'champions',
      path: CHAMPIONS_PATH,
      file: await updatedDataFile(
        CHAMPIONS_PATH,
        ChampionDataFileSchema,
        championStats,
        champions,
        fresh,
      ),
    },
    {
      name: 'items',
      path: ITEMS_PATH,
      file: await updatedDataFile(ITEMS_PATH, ItemDataFileSchema, itemStats, items, fresh),
    },
    {
      name: 'abilities',
      path: ABILITIES_PATH,
      file: await updatedDataFile(
        ABILITIES_PATH,
        AbilityDataFileSchema,
        abilityStats,
        abilities,
        fresh,
      ),
    },
  ];

  for (const { path: filePath, file } of files) await writeJsonAtomically(filePath, file);
  for (const { name, file } of files) {
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
