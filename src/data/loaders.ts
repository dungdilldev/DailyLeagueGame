import { PuzzleSchema, type Puzzle } from './puzzleSchema';
import { ChampionsFileSchema, type ChampionsFile } from './schema';

export class PuzzleNotFoundError extends Error {
  constructor(date: string) {
    super(`No puzzle published for ${date}`);
    this.name = 'PuzzleNotFoundError';
  }
}

export type HttpFetcher = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const browserFetcher: HttpFetcher = (url) => fetch(url);
const NOT_FOUND_STATUS = 404;

async function getJson(
  fetcher: HttpFetcher,
  url: string,
): Promise<{ status: number; body: unknown }> {
  const response = await fetcher(url);
  if (!response.ok) return { status: response.status, body: undefined };
  return { status: response.status, body: (await response.json()) as unknown };
}

export async function loadPuzzle(
  date: string,
  fetcher: HttpFetcher = browserFetcher,
  baseUrl: string = import.meta.env.BASE_URL,
): Promise<Puzzle> {
  const { status, body } = await getJson(fetcher, `${baseUrl}data/puzzles/${date}.json`);
  if (status === NOT_FOUND_STATUS) throw new PuzzleNotFoundError(date);
  if (body === undefined) throw new Error(`Could not load puzzle (HTTP ${String(status)})`);
  return PuzzleSchema.parse(body);
}

export async function loadChampions(
  fetcher: HttpFetcher = browserFetcher,
  baseUrl: string = import.meta.env.BASE_URL,
): Promise<ChampionsFile> {
  const { status, body } = await getJson(fetcher, `${baseUrl}data/champions.json`);
  if (body === undefined) throw new Error(`Could not load champions (HTTP ${String(status)})`);
  return ChampionsFileSchema.parse(body);
}
