import { describe, expect, it } from 'vitest';
import type { Entity } from '../../src/data/schema';
import type { Puzzle, Round } from '../../src/game/puzzle';
import { remainingImageUrls, roundImageUrls } from '../../src/game/roundImages';

function round(subject: Round['subject'], optionIds: string[]): Round {
  return {
    questionId: 'q',
    subject,
    statLabel: 'Label',
    question: 'Question?',
    format: undefined,
    optionIds,
    answerId: optionIds[0] ?? '',
    values: {},
  };
}

function champion(id: string, iconUrl: string): Entity {
  return { id, name: id, iconUrl } as Entity;
}

const champions = new Map<string, Entity>([
  ['Ahri', champion('Ahri', 'https://icons.test/Ahri.png')],
  ['Zed', champion('Zed', 'https://icons.test/Zed.png')],
]);
const entities = { champion: champions, item: new Map<string, Entity>(), text: new Map() };

const ESPORTS_TEAMS = ['T1', 'Gen.G', 'Cloud9', 'Fnatic'];

describe('roundImageUrls', () => {
  it('uses the champion icons of a champion round', () => {
    expect(roundImageUrls(round('champion', ['Ahri', 'Zed']), champions)).toEqual([
      'https://icons.test/Ahri.png',
      'https://icons.test/Zed.png',
    ]);
  });

  it('uses the team logos of an esports round', () => {
    const urls = roundImageUrls(round('text', ESPORTS_TEAMS), new Map());
    expect(urls).toHaveLength(ESPORTS_TEAMS.length);
    expect(urls.every((url) => url.endsWith('.webp'))).toBe(true);
  });

  it('has none for a text round without images', () => {
    expect(
      roundImageUrls(round('text', ['Wuju', 'Navori', 'Hirana Monastery']), new Map()),
    ).toEqual([]);
  });
});

describe('remainingImageUrls', () => {
  const puzzle: Puzzle = {
    date: '2026-01-01',
    rounds: [
      round('champion', ['Ahri']),
      round('champion', ['Zed', 'Ahri']),
      round('text', ESPORTS_TEAMS),
    ],
  };

  it('lists the images of the given round and all later ones, without repeats', () => {
    const urls = remainingImageUrls(puzzle, 0, entities);
    expect(urls.slice(0, 2)).toEqual(['https://icons.test/Ahri.png', 'https://icons.test/Zed.png']);
    expect(urls).toHaveLength(2 + ESPORTS_TEAMS.length);
  });

  it('skips rounds that were already shown', () => {
    expect(remainingImageUrls(puzzle, 2, entities)).toHaveLength(ESPORTS_TEAMS.length);
    expect(remainingImageUrls(puzzle, 3, entities)).toEqual([]);
  });
});
