import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadGameData, type HttpFetcher } from '../data/loaders';
import { renderGamePage } from './renderGamePage';

/** Reads the published data files from disk, where the browser used to fetch them from the site. */
function fileFetcher(siteRoot: string): HttpFetcher {
  return async (url) => {
    const json = JSON.parse(await readFile(path.join(siteRoot, url), 'utf8')) as unknown;
    return { ok: true, status: 200, json: () => Promise.resolve(json) };
  };
}

/**
 * Entry for the build (`vite.config.ts`): builds `today`'s puzzles into a game page from the data
 * files in `siteRoot` (`public`). The data is read for every page, so the dev server always
 * shows the current files.
 */
export async function prerenderGamePage(
  html: string,
  today: string,
  siteRoot: string,
): Promise<string> {
  return renderGamePage(html, await loadGameData(fileFetcher(siteRoot), ''), today);
}
