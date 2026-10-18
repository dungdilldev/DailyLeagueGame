import { describe, expect, it } from 'vitest';
import playerFile from '../../data/players.json';
import { PlayerFileSchema } from '../../src/data/playerSchema';

const player = {
  name: 'Faker',
  region: 'Korea',
  titles: [{ event: 'Worlds', year: 2013 }],
  teams: ['T1'],
  nickname: 'Unkillable Demon King',
};
const parse = (players: unknown[]) => PlayerFileSchema.safeParse({ players });

describe('PlayerFileSchema', () => {
  it('accepts a player with and without a nickname or titles', () => {
    expect(parse([player]).success).toBe(true);
    expect(parse([{ ...player, nickname: undefined, titles: [] }]).success).toBe(true);
  });

  it('rejects a player with no team, an unknown region or an unknown event', () => {
    expect(parse([{ ...player, teams: [] }]).success).toBe(false);
    expect(parse([{ ...player, region: 'Mars' }]).success).toBe(false);
    expect(parse([{ ...player, titles: [{ event: 'LCK', year: 2020 }] }]).success).toBe(false);
  });

  it('rejects duplicate names, teams and titles, which would double count', () => {
    expect(parse([player, player]).success).toBe(false);
    expect(parse([{ ...player, teams: ['T1', 'T1'] }]).success).toBe(false);
    const title = { event: 'MSI', year: 2016 };
    expect(parse([{ ...player, titles: [title, title] }]).success).toBe(false);
  });

  it('rejects a misspelled key instead of ignoring it', () => {
    expect(parse([{ ...player, nickName: 'x' }]).success).toBe(false);
  });
});

describe('data/players.json', () => {
  it('is valid', () => {
    expect(PlayerFileSchema.safeParse(playerFile).success).toBe(true);
  });
});
