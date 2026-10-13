import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  loadChampions,
  loadPuzzle,
  PuzzleNotFoundError,
  type HttpFetcher,
} from '../../src/data/loaders';

const respond =
  (status: number, body?: unknown): HttpFetcher =>
  () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

describe('loadPuzzle', () => {
  it('requests the date-specific file and validates it', async () => {
    const urls: string[] = [];
    const body = readJson('public/data/puzzles/2026-10-13.json');
    const fetcher: HttpFetcher = (url) => {
      urls.push(url);
      return respond(200, body)(url);
    };
    const puzzle = await loadPuzzle('2026-10-13', fetcher, './');
    expect(urls).toEqual(['./data/puzzles/2026-10-13.json']);
    expect(puzzle.rounds).toHaveLength(5);
  });

  it('throws PuzzleNotFoundError on 404 so the UI can show a friendly message', async () => {
    await expect(loadPuzzle('2020-01-01', respond(404), './')).rejects.toBeInstanceOf(
      PuzzleNotFoundError,
    );
  });

  it('rejects malformed puzzle data', async () => {
    await expect(loadPuzzle('2026-10-13', respond(200, { rounds: [] }), './')).rejects.toThrow();
  });

  it('reports other HTTP failures as errors', async () => {
    await expect(loadPuzzle('2026-10-13', respond(500), './')).rejects.toThrow(/HTTP 500/);
  });
});

describe('loadChampions', () => {
  it('loads and validates the champion file', async () => {
    const body = readJson('public/data/champions.json');
    const file = await loadChampions(respond(200, body), './');
    expect(file.champions.length).toBeGreaterThan(100);
  });
});
