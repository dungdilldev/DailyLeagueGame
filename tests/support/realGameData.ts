import { readFileSync } from 'node:fs';
import playerFile from '../../data/players.json';
import { PlayerFileSchema } from '../../src/data/playerSchema';
import { parseQuestionFiles, QUESTION_FILES } from '../../src/data/questionFiles';
import { resolveQuestions, type GameData } from '../../src/data/questions';
import {
  AbilityDataFileSchema,
  ChampionDataFileSchema,
  ItemDataFileSchema,
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
  return {
    champions,
    items,
    abilities,
    questions: resolveQuestions(
      parseQuestionFiles(QUESTION_FILES),
      { champion: champions.stats, item: items.stats, ability: abilities.stats },
      PlayerFileSchema.parse(playerFile).players,
    ),
  };
}

export const realGameData = loadRealGameData();
export const realPuzzleData = newestPuzzleData(realGameData);
