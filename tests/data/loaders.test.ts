import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  loadChampions,
  loadPuzzle,
  PuzzleNotFoundError,
  type HttpFetcher,
} from '../../src/data/loaders';

const PUZZLES_DIR = 'public/data/puzzles';

const respond =
  (status: number, body?: unknown): HttpFetcher =>
  () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

// Any published puzzle will do; the files present change as the pipeline generates new days.
const [anyPuzzleFile] = readdirSync(PUZZLES_DIR).filter((name) => name.endsWith('.json'));
if (!anyPuzzleFile)
  throw new Error(`No puzzles found in ${PUZZLES_DIR}; run npm run data:generate`);
const PUZZLE_DATE = anyPuzzleFile.replace('.json', '');

describe('loadPuzzle', () => {
  it('requests the date-specific file and validates it', async () => {
    const urls: string[] = [];
    const body = readJson(`${PUZZLES_DIR}/${anyPuzzleFile}`);
    const fetcher: HttpFetcher = (url) => {
      urls.push(url);
      return respond(200, body)(url);
    };
    const puzzle = await loadPuzzle(PUZZLE_DATE, fetcher, './');
    expect(urls).toEqual([`./data/puzzles/${PUZZLE_DATE}.json`]);
    expect(puzzle.rounds).toHaveLength(5);
  });

  it('throws PuzzleNotFoundError on 404 so the UI can show a friendly message', async () => {
    await expect(loadPuzzle('2020-01-01', respond(404), './')).rejects.toBeInstanceOf(
      PuzzleNotFoundError,
    );
  });

  it('rejects malformed puzzle data', async () => {
    await expect(loadPuzzle(PUZZLE_DATE, respond(200, { rounds: [] }), './')).rejects.toThrow();
  });

  it('reports other HTTP failures as errors', async () => {
    await expect(loadPuzzle(PUZZLE_DATE, respond(500), './')).rejects.toThrow(/HTTP 500/);
  });
});

describe('loadChampions', () => {
  it('loads and validates the champion file', async () => {
    const body = readJson('public/data/champions.json');
    const file = await loadChampions(respond(200, body), './');
    expect(file.champions.length).toBeGreaterThan(100);
  });
});
