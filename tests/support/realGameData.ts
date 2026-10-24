import { readFileSync } from 'node:fs';
import playerFile from '../../data/players.json';
import questionFile from '../../data/questions.json';
import { PlayerFileSchema } from '../../src/data/playerSchema';
import { resolveQuestions, type GameData } from '../../src/data/questions';
import {
  AbilityDataFileSchema,
  ChampionDataFileSchema,
  ItemDataFileSchema,
  QuestionFileSchema,
} from '../../src/data/schema';
import { newestPuzzleData } from '../../src/game/dailyPuzzle';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** The published data files and the hand-written questions, exactly as the game loads them. */
export function loadRealGameData(): GameData {
  const champions = ChampionDataFileSchema.parse(readJson('public/data/champions.json'));
  const items = ItemDataFileSchema.parse(readJson('public/data/items.json'));
  const abilities = AbilityDataFileSchema.parse(readJson('public/data/abilities.json'));
  const { questions } = QuestionFileSchema.parse(questionFile);
  return {
    champions,
    items,
    abilities,
    questions: resolveQuestions(
      questions,
      { champion: champions.stats, item: items.stats, ability: abilities.stats },
      PlayerFileSchema.parse(playerFile).players,
    ),
  };
}

export const realGameData = loadRealGameData();
export const realPuzzleData = newestPuzzleData(realGameData);
