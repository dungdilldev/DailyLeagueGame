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
import { realGameData } from '../support/realGameData';

const { questions } = realGameData;

describe('GAME_MODES', () => {
  it('lists one mode per question category, then the mixed mode', () => {
    expect(GAME_MODES).toEqual(['stats', 'lore', 'esports', 'trivia', 'mixed']);
  });
});

describe('parseGameMode', () => {
  it('accepts every mode and falls back to stats for anything else', () => {
    for (const mode of GAME_MODES) expect(parseGameMode(mode)).toBe(mode);
    for (const bad of [null, undefined, '', 'nope', 'LORE', 'endless']) {
      expect(parseGameMode(bad)).toBe('stats');
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
    expect(nextUnfinishedMode('stats', [])).toBe('lore');
    expect(nextUnfinishedMode('stats', ['stats', 'lore'])).toBe('esports');
  });

  it('wraps round after the last mode', () => {
    expect(nextUnfinishedMode(MIXED_MODE, [MIXED_MODE])).toBe('stats');
    expect(nextUnfinishedMode('trivia', ['trivia', MIXED_MODE, 'stats'])).toBe('lore');
  });

  it('never suggests the current mode, and nothing once all others are finished', () => {
    const othersFinished = GAME_MODES.filter((mode) => mode !== 'lore');
    expect(nextUnfinishedMode('lore', othersFinished)).toBeUndefined();
    expect(nextUnfinishedMode('lore', GAME_MODES)).toBeUndefined();
  });
});
