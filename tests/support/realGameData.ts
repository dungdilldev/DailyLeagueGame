import { readFileSync } from 'node:fs';
import questionFile from '../../data/questions.json';
import { resolveQuestions, type GameData } from '../../src/data/questions';
import {
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
  const { questions } = QuestionFileSchema.parse(questionFile);
  return {
    champions,
    items,
    questions: resolveQuestions(questions, { champion: champions.stats, item: items.stats }),
  };
}

export const realGameData = loadRealGameData();
export const realPuzzleData = newestPuzzleData(realGameData);
