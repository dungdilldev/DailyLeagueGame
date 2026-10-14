import { GameDataFileSchema, type GameDataFile } from './schema';

export type HttpFetcher = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const browserFetcher: HttpFetcher = (url) => fetch(url);

export async function loadGameData(
  fetcher: HttpFetcher = browserFetcher,
  baseUrl: string = import.meta.env.BASE_URL,
): Promise<GameDataFile> {
  const response = await fetcher(`${baseUrl}data/game-data.json`);
  if (!response.ok) throw new Error(`Could not load game data (HTTP ${String(response.status)})`);
  return GameDataFileSchema.parse((await response.json()) as unknown);
}
