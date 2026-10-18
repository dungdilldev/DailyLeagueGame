import playerFile from '../../data/players.json';
import questionFile from '../../data/questions.json';
import { PlayerFileSchema } from './playerSchema';
import { resolveQuestions, type GameData } from './questions';
import { ChampionDataFileSchema, ItemDataFileSchema, QuestionFileSchema } from './schema';

export type HttpFetcher = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const browserFetcher: HttpFetcher = (url) => fetch(url);

async function fetchJson(fetcher: HttpFetcher, url: string, what: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Could not load ${what} (HTTP ${String(response.status)})`);
  return (await response.json()) as unknown;
}

/**
 * Loads the generated champion and item data and combines it with the hand-written questions,
 * and the esports players, which are part of the app bundle. Everything is validated before it is passed on.
 */
export async function loadGameData(
  fetcher: HttpFetcher = browserFetcher,
  baseUrl: string = import.meta.env.BASE_URL,
  questionSource: unknown = questionFile,
  playerSource: unknown = playerFile,
): Promise<GameData> {
  const [championJson, itemJson] = await Promise.all([
    fetchJson(fetcher, `${baseUrl}data/champions.json`, 'champion data'),
    fetchJson(fetcher, `${baseUrl}data/items.json`, 'item data'),
  ]);
  const champions = ChampionDataFileSchema.parse(championJson);
  const items = ItemDataFileSchema.parse(itemJson);
  const { questions } = QuestionFileSchema.parse(questionSource);
  const { players } = PlayerFileSchema.parse(playerSource);
  return {
    champions,
    items,
    questions: resolveQuestions(
      questions,
      { champion: champions.stats, item: items.stats },
      players,
    ),
  };
}
