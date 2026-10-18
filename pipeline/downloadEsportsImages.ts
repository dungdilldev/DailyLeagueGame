import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  ESPORTS_IMAGE_DIRECTORY,
  esportsImagePath,
  esportsImages,
  type EsportsImageKind,
} from '../src/data/esportsImages';

/** Leaguepedia scales an image on request, so no image library is needed. */
const IMAGE_WIDTH = 160;
const FILE_URL = 'https://lol.fandom.com/wiki/Special:FilePath/';
const USER_AGENT = 'DailyLeagueGame/1.0 (hobby project; one-off image download)';
const PAUSE_BETWEEN_DOWNLOADS_MS = 400;
const OUTPUT_ROOT = path.join('public', ESPORTS_IMAGE_DIRECTORY);

const run = promisify(execFile);
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/** Fandom turns away Node's HTTP client (even with a plain user agent) but not curl, so use curl. */
async function download(fileName: string, target: string): Promise<void> {
  const url = `${FILE_URL}${encodeURIComponent(fileName.replaceAll(' ', '_'))}?width=${String(IMAGE_WIDTH)}`;
  await run('curl', [
    '--silent',
    '--show-error',
    '--fail',
    '--location',
    '--user-agent',
    USER_AGENT,
    '--output',
    target,
    url,
  ]);
}

async function main(): Promise<void> {
  const failures: string[] = [];
  const kinds = Object.keys(esportsImages) as EsportsImageKind[];
  for (const kind of kinds) {
    for (const [name, fileName] of Object.entries(esportsImages[kind])) {
      const target = path.join(OUTPUT_ROOT, esportsImagePath(kind, name));
      try {
        await mkdir(path.dirname(target), { recursive: true });
        await download(fileName, target);
      } catch (error) {
        failures.push(`${kind} ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await sleep(PAUSE_BETWEEN_DOWNLOADS_MS);
    }
  }
  if (failures.length > 0) throw new Error(`Some images failed:\n${failures.join('\n')}`);
}

await main();
