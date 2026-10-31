import playerFile from '../../data/players.json';
import { PlayerFileSchema } from './playerSchema';
import { parseQuestionFiles, QUESTION_FILES, type QuestionSources } from './questionFiles';
import { resolveQuestions, type GameData } from './questions';
import { AbilityDataFileSchema, ChampionDataFileSchema, ItemDataFileSchema } from './schema';

export type HttpFetcher = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const browserFetcher: HttpFetcher = (url) => fetch(url);

async function fetchJson(fetcher: HttpFetcher, url: string, what: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Could not load ${what} (HTTP ${String(response.status)})`);
  return (await response.json()) as unknown;
}

/**
 * Loads the generated champion, item and ability data and combines it with the hand-written questions,
 * and the esports players, which are part of the app bundle. Everything is validated before it is passed on.
 */
export async function loadGameData(
  fetcher: HttpFetcher = browserFetcher,
  baseUrl: string = import.meta.env.BASE_URL,
  questionSources: QuestionSources = QUESTION_FILES,
  playerSource: unknown = playerFile,
): Promise<GameData> {
  const [championJson, itemJson, abilityJson] = await Promise.all([
    fetchJson(fetcher, `${baseUrl}data/champions.json`, 'champion data'),
    fetchJson(fetcher, `${baseUrl}data/items.json`, 'item data'),
    fetchJson(fetcher, `${baseUrl}data/abilities.json`, 'ability data'),
  ]);
  const champions = ChampionDataFileSchema.parse(championJson);
  const items = ItemDataFileSchema.parse(itemJson);
  const abilities = AbilityDataFileSchema.parse(abilityJson);
  const { players } = PlayerFileSchema.parse(playerSource);
  return {
    champions,
    items,
    abilities,
    questions: resolveQuestions(
      parseQuestionFiles(questionSources),
      { champion: champions.stats, item: items.stats, ability: abilities.stats },
      players,
    ),
  };
}
