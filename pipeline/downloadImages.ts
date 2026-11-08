import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { CREST_FILES, CREST_IMAGE_DIRECTORY, crestImagePath } from '../src/data/crestImages';
import {
  ESPORTS_IMAGE_DIRECTORY,
  esportsImagePath,
  esportsImages,
  type EsportsImageKind,
} from '../src/data/esportsImages';
import { STAT_ICON_FILES, statIconUrl, type StatIcon } from '../src/data/statIcons';

/** Leaguepedia scales an image on request, so no image library is needed. */
const ESPORTS_IMAGE_WIDTH = 160;
const LEAGUEPEDIA_FILE_URL = 'https://lol.fandom.com/wiki/Special:FilePath/';
/** The crests and stat symbols are small already; the wiki serves them as they are. */
const WIKI_FILE_URL = 'https://wiki.leagueoflegends.com/en-us/images/';
const USER_AGENT = 'DailyLeagueGame/1.0 (hobby project; one-off image download)';
const PAUSE_BETWEEN_DOWNLOADS_MS = 400;

const run = promisify(execFile);
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

interface Download {
  label: string;
  url: string;
  /** Path of the saved file, below `public`. */
  target: string;
}

function wikiFileName(fileName: string): string {
  return encodeURIComponent(fileName.replaceAll(' ', '_'));
}

function esportsDownloads(): Download[] {
  const kinds = Object.keys(esportsImages) as EsportsImageKind[];
  return kinds.flatMap((kind) =>
    Object.entries(esportsImages[kind]).map(([name, fileName]) => ({
      label: `${kind} ${name}`,
      url: `${LEAGUEPEDIA_FILE_URL}${wikiFileName(fileName)}?width=${String(ESPORTS_IMAGE_WIDTH)}`,
      target: path.join(ESPORTS_IMAGE_DIRECTORY, esportsImagePath(kind, name)),
    })),
  );
}

/** One download per crest file: several option names can share a crest. */
function crestDownloads(): Download[] {
  return [...new Set(Object.values(CREST_FILES))].map((fileName) => ({
    label: `crest ${fileName}`,
    url: `${WIKI_FILE_URL}${wikiFileName(fileName)}`,
    target: path.join(CREST_IMAGE_DIRECTORY, crestImagePath(fileName)),
  }));
}

function statIconDownloads(): Download[] {
  return (Object.entries(STAT_ICON_FILES) as [StatIcon, string][]).map(([icon, fileName]) => ({
    label: `stat symbol ${fileName}`,
    url: `${WIKI_FILE_URL}${wikiFileName(fileName)}`,
    target: statIconUrl(icon),
  }));
}

/** Fandom turns away Node's HTTP client (even with a plain user agent) but not curl, so use curl. */
async function download({ url, target }: Download): Promise<void> {
  const file = path.join('public', target);
  await mkdir(path.dirname(file), { recursive: true });
  await run('curl', [
    '--silent',
    '--show-error',
    '--fail',
    '--location',
    '--user-agent',
    USER_AGENT,
    '--output',
    file,
    url,
  ]);
}

/** Files already saved are skipped; delete one to fetch it again (e.g. after a team's rebrand). */
async function main(): Promise<void> {
  const failures: string[] = [];
  const missing = [...esportsDownloads(), ...crestDownloads(), ...statIconDownloads()].filter(
    ({ target }) => !existsSync(path.join('public', target)),
  );
  console.log(`${String(missing.length)} images to download`);
  for (const entry of missing) {
    try {
      await download(entry);
    } catch (error) {
      failures.push(`${entry.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(PAUSE_BETWEEN_DOWNLOADS_MS);
  }
  if (failures.length > 0) throw new Error(`Some images failed:\n${failures.join('\n')}`);
}

await main();
