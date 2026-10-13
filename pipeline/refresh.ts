import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildChampionsFile, type ChampionSource } from './buildChampions';
import {
  fetchChampionDetail,
  fetchChampionSummaries,
  fetchJson,
  fetchLatestVersion,
} from './sources/dataDragon';
import { STAT_REGISTRY } from './stats';
import { findProblems } from './validate/championsFile';

const OUTPUT_PATH = path.resolve('public/data/champions.json');
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

/** Writes via a temp file so a crash never leaves a half-written champions.json. */
async function writeJsonAtomically(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tempPath, filePath);
}

async function main(): Promise<void> {
  const version = await fetchLatestVersion(fetchJson);
  console.log(`Data Dragon version ${version}`);

  const summaries = await fetchChampionSummaries(fetchJson, version);
  const sources: ChampionSource[] = await mapWithConcurrency(
    summaries,
    CONCURRENCY,
    async (summary) => ({
      summary,
      detail: await fetchChampionDetail(fetchJson, version, summary.id),
    }),
  );

  const file = buildChampionsFile(sources, version, STAT_REGISTRY);
  const problems = findProblems(file, STAT_REGISTRY);
  if (problems.length > 0) {
    throw new Error(`Refusing to write invalid data:\n- ${problems.join('\n- ')}`);
  }

  await writeJsonAtomically(OUTPUT_PATH, file);
  console.log(`Wrote ${String(file.champions.length)} champions to ${OUTPUT_PATH}`);

  const sample = file.champions.find((champion) => champion.id === 'Ahri') ?? file.champions[0];
  if (sample) console.log(`Sample: ${sample.name}`, sample.stats);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
