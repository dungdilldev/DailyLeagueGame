import { describe, expect, it } from 'vitest';
import {
  GAME_MODES,
  MIXED_MODE,
  nextUnfinishedMode,
  parseGameMode,
  progressSlot,
  puzzleSeed,
  questionsForMode,
} from '../../src/game/gameMode';
import { QuestionCategorySchema } from '../../src/data/schema';
import { realGameData } from '../support/realGameData';

const { questions } = realGameData;

describe('GAME_MODES', () => {
  it('lists the categories in display order, then the mixed mode', () => {
    expect(GAME_MODES).toEqual(['trivia', 'lore', 'stats', 'esports', 'mixed']);
  });

  it('has every question category exactly once', () => {
    const categories = GAME_MODES.filter((mode) => mode !== MIXED_MODE);
    expect([...categories].sort()).toEqual([...QuestionCategorySchema.options].sort());
  });
});

describe('parseGameMode', () => {
  it('accepts every mode and falls back to trivia for anything else', () => {
    for (const mode of GAME_MODES) expect(parseGameMode(mode)).toBe(mode);
    for (const bad of [null, undefined, '', 'nope', 'LORE', 'endless']) {
      expect(parseGameMode(bad)).toBe('trivia');
    }
  });
});

describe('questionsForMode', () => {
  it('gives every question in the mixed mode', () => {
    expect(questionsForMode(questions, MIXED_MODE)).toEqual(questions);
  });

  it('gives only the questions of the category, and the categories add up to the whole pool', () => {
    let total = 0;
    for (const mode of GAME_MODES.filter((each) => each !== MIXED_MODE)) {
      const inMode = questionsForMode(questions, mode);
      expect(inMode.length, mode).toBeGreaterThan(0);
      expect(inMode.every((question) => question.category === mode)).toBe(true);
      total += inMode.length;
    }
    expect(total).toBe(questions.length);
  });
});

describe('puzzleSeed and progressSlot', () => {
  it('keep the mixed mode on the plain date and the original save slot', () => {
    expect(puzzleSeed('2026-03-05', MIXED_MODE)).toBe('2026-03-05');
    expect(progressSlot(MIXED_MODE)).toBeUndefined();
  });

  it('give every other mode its own seed and save slot', () => {
    const seeds = GAME_MODES.map((mode) => puzzleSeed('2026-03-05', mode));
    expect(new Set(seeds).size).toBe(GAME_MODES.length);
    expect(progressSlot('lore')).toBe('lore');
  });
});

describe('nextUnfinishedMode', () => {
  it('suggests the next mode in order, skipping finished ones', () => {
    expect(nextUnfinishedMode('trivia', [])).toBe('lore');
    expect(nextUnfinishedMode('trivia', ['trivia', 'lore'])).toBe('stats');
  });

  it('wraps round after the last mode', () => {
    expect(nextUnfinishedMode(MIXED_MODE, [MIXED_MODE])).toBe('trivia');
    expect(nextUnfinishedMode('esports', ['esports', MIXED_MODE, 'trivia'])).toBe('lore');
  });

  it('never suggests the current mode, and nothing once all others are finished', () => {
    const othersFinished = GAME_MODES.filter((mode) => mode !== 'lore');
    expect(nextUnfinishedMode('lore', othersFinished)).toBeUndefined();
    expect(nextUnfinishedMode('lore', GAME_MODES)).toBeUndefined();
  });
});
