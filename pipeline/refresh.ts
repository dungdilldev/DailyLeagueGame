import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GameDataFileSchema, type Snapshot } from '../src/data/schema';
import { formatUtcDate } from '../src/game/date';
import { buildChampions } from './buildChampions';
import { mergeSnapshots } from './snapshots';
import {
  fetchChampionDetail,
  fetchChampionSummaries,
  fetchJson,
  fetchLatestVersion,
} from './sources/dataDragon';
import { buildWikiLookup, fetchText, fetchWikiChampions } from './sources/leagueWiki';
import { STAT_REGISTRY } from './stats';
import { toStatMeta, type StatInput } from './stats/types';
import { findProblems } from './validate/championsFile';

const OUTPUT_PATH = path.resolve('public/data/game-data.json');
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
async function readExistingSnapshots(filePath: string): Promise<Snapshot[]> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    return [];
  }
  const parsed = GameDataFileSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.warn('Existing game data does not match the current format; starting fresh.');
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
  const inputs: StatInput[] = await mapWithConcurrency(summaries, CONCURRENCY, async (summary) => ({
    summary,
    detail: await fetchChampionDetail(fetchJson, version, summary.id),
    wiki: findWikiChampion(Number(summary.key), summary.id),
  }));

  const champions = buildChampions(inputs, version, STAT_REGISTRY);
  const problems = findProblems(champions, STAT_REGISTRY);
  if (problems.length > 0) {
    throw new Error(`Refusing to write invalid data:\n- ${problems.join('\n- ')}`);
  }

  const existing = await readExistingSnapshots(OUTPUT_PATH);
  const snapshots = mergeSnapshots(
    existing,
    { patch: version, champions },
    formatUtcDate(new Date()),
  );
  const file = GameDataFileSchema.parse({ stats: STAT_REGISTRY.map(toStatMeta), snapshots });

  await writeJsonAtomically(OUTPUT_PATH, file);
  for (const snapshot of snapshots) {
    console.log(
      `Snapshot patch ${snapshot.patch}: ${String(snapshot.champions.length)} champions, effective from ${snapshot.effectiveFrom}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
