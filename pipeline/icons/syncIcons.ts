import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mapWithConcurrency } from '../concurrency';
import type { BytesFetcher } from '../sources/dataDragon';
import { ICON_DIRECTORY } from './iconPaths';

/** One icon to have on disk: its path below the site root and where Data Dragon serves it. */
export interface IconSource {
  path: string;
  url: string;
}

export interface IconSyncPlan {
  download: IconSource[];
  /** Paths below the site root. */
  remove: string[];
}

interface PlanInput {
  sources: readonly IconSource[];
  /** Icons the published snapshots point at; an older snapshot may still need one. */
  inUse: ReadonlySet<string>;
  /** Icons already on disk. */
  existing: ReadonlySet<string>;
  /** True when the icons on disk come from another Data Dragon version. */
  isNewVersion: boolean;
}

/**
 * What to fetch and what to delete. A new version fetches every icon again, because a rework can
 * change the art under the same file name; otherwise only missing icons are fetched. Icons that
 * nothing uses any more are deleted.
 */
export function planIconSync({ sources, inUse, existing, isNewVersion }: PlanInput): IconSyncPlan {
  const keep = new Set([...inUse, ...sources.map((source) => source.path)]);
  return {
    download: isNewVersion ? [...sources] : sources.filter((source) => !existing.has(source.path)),
    remove: [...existing].filter((iconPath) => !keep.has(iconPath)).sort(),
  };
}

/** Records which Data Dragon version the icons on disk come from. */
const VERSION_FILE = 'version.txt';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const CONCURRENCY = 8;

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

/** Icon paths below the site root (with forward slashes), or none if the folder does not exist. */
async function listIcons(siteRoot: string): Promise<Set<string>> {
  try {
    const files = await readdir(path.join(siteRoot, ICON_DIRECTORY), { recursive: true });
    return new Set(
      files
        .filter((file) => file.endsWith('.png'))
        .map((file) => `${ICON_DIRECTORY}/${file.split(path.sep).join('/')}`),
    );
  } catch {
    return new Set();
  }
}

async function readVersion(siteRoot: string): Promise<string | undefined> {
  try {
    return (await readFile(path.join(siteRoot, ICON_DIRECTORY, VERSION_FILE), 'utf8')).trim();
  } catch {
    return undefined;
  }
}

async function downloadIcon(siteRoot: string, source: IconSource, fetcher: BytesFetcher) {
  const bytes = await fetcher(source.url);
  if (!isPng(bytes)) throw new Error(`${source.url} is not a PNG image`);
  const target = path.join(siteRoot, source.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

interface SyncInput {
  /** The folder the site is served from (`public`). */
  siteRoot: string;
  sources: readonly IconSource[];
  inUse: ReadonlySet<string>;
  version: string;
  fetcher: BytesFetcher;
}

/**
 * Brings the icons on disk in line with the data. Any failed download fails the whole run; the
 * version is recorded only at the end, so the next run fetches everything again after a failure.
 */
export async function syncIcons({ siteRoot, sources, inUse, version, fetcher }: SyncInput) {
  const plan = planIconSync({
    sources,
    inUse,
    existing: await listIcons(siteRoot),
    isNewVersion: (await readVersion(siteRoot)) !== version,
  });
  await mapWithConcurrency(plan.download, CONCURRENCY, (source) =>
    downloadIcon(siteRoot, source, fetcher),
  );
  for (const iconPath of plan.remove) await rm(path.join(siteRoot, iconPath));
  await mkdir(path.join(siteRoot, ICON_DIRECTORY), { recursive: true });
  await writeFile(path.join(siteRoot, ICON_DIRECTORY, VERSION_FILE), `${version}\n`);
  return { downloaded: plan.download.length, removed: plan.remove.length };
}
