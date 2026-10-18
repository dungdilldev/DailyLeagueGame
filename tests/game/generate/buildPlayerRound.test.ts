import { describe, expect, it } from 'vitest';
import type { PlayerQuestion } from '../../../src/data/questions';
import type { Player } from '../../../src/data/playerSchema';
import type { Entity } from '../../../src/data/schema';
import { buildPlayerRound } from '../../../src/game/generate/buildPlayerRound';
import { createRng } from '../../../src/game/generate/random';

const player = (name: string, teams: string[]): Player => ({
  name,
  region: 'Korea',
  titles: [],
  teams,
});

const players = [
  { ...player('Faker', ['T1']), nickname: 'Unkillable Demon King' },
  { ...player('Keria', ['DRX', 'T1']), nickname: 'The Genius Monster' },
  player('Deft', ['DRX', 'KT Rolster']),
  player('Uzi', ['Royal Never Give Up', 'Edward Gaming']),
  { ...player('Caps', ['Fnatic', 'G2 Esports']), nickname: 'Baby Faker' },
  player('Perkz', ['G2 Esports', 'Cloud9']),
];

const question = (ask: PlayerQuestion['ask']): PlayerQuestion => ({
  kind: 'player',
  id: ask,
  category: 'esports',
  difficulty: 'medium',
  subject: 'text',
  label: 'Players and teams',
  ask,
  question: {
    playerByTeam: 'Which player has played for {team}?',
    teamByPlayer: 'Which team has {player} played for?',
    playerByNickname: 'Which player is nicknamed "{nickname}"?',
  }[ask],
  players,
});

const entities = (names: string[]): Entity[] =>
  names.map((name) => ({ id: name, name, iconUrl: '', stats: {} }));
const allNames = (ask: PlayerQuestion['ask']) =>
  entities(
    ask === 'teamByPlayer'
      ? [...new Set(players.flatMap(({ teams }) => teams))]
      : players.map(({ name }) => name),
  );
const seeds = Array.from({ length: 50 }, (_, index) => `seed${String(index)}`);

describe('buildPlayerRound', () => {
  it('asks which player played for the named team, with three players who did not', () => {
    for (const seed of seeds) {
      const round = buildPlayerRound(
        allNames('playerByTeam'),
        question('playerByTeam'),
        createRng(seed),
      );
      expect(round).toBeDefined();
      const team = round?.question.match(/played for (.+)\?/)?.[1];
      const played = (name: string) =>
        players.find((p) => p.name === name)?.teams.includes(team ?? '');
      expect(played(round?.answerId ?? '')).toBe(true);
      const others = round?.optionIds.filter((id) => id !== round.answerId) ?? [];
      expect(others).toHaveLength(3);
      expect(others.some(played)).toBe(false);
    }
  });

  it('asks which team the named player played for, with three teams they did not', () => {
    for (const seed of seeds) {
      const round = buildPlayerRound(
        allNames('teamByPlayer'),
        question('teamByPlayer'),
        createRng(seed),
      );
      expect(round).toBeDefined();
      const name = round?.question.match(/Which team has (.+) played for\?/)?.[1];
      const teams = players.find((p) => p.name === name)?.teams ?? [];
      expect(teams).toContain(round?.answerId);
      const others = round?.optionIds.filter((id) => id !== round.answerId) ?? [];
      expect(others).toHaveLength(3);
      expect(others.filter((id) => teams.includes(id))).toEqual([]);
    }
  });

  it('quotes a nickname and offers its player plus three players with other nicknames', () => {
    const nicknames = new Map(players.map((p) => [p.name, p.nickname]));
    for (const seed of seeds) {
      const round = buildPlayerRound(
        allNames('playerByNickname'),
        question('playerByNickname'),
        createRng(seed),
      );
      expect(round).toBeDefined();
      const quoted = round?.question.match(/nicknamed "(.+)"\?/)?.[1];
      expect(nicknames.get(round?.answerId ?? '')).toBe(quoted);
      const others = round?.optionIds.filter((id) => id !== round.answerId) ?? [];
      expect(others).toHaveLength(3);
      expect(others.map((id) => nicknames.get(id))).not.toContain(quoted);
    }
  });

  it('only quotes nicknames that exist', () => {
    const nobody = {
      ...question('playerByNickname'),
      players: players.map(({ name, region, titles, teams }) => ({ name, region, titles, teams })),
    };
    expect(buildPlayerRound(allNames('playerByNickname'), nobody, createRng('s'))).toBeUndefined();
  });

  it('is deterministic for a seed', () => {
    const build = () =>
      buildPlayerRound(allNames('playerByTeam'), question('playerByTeam'), createRng('same'));
    expect(build()).toEqual(build());
  });

  it('only offers names that are still available', () => {
    const left = entities(['Faker', 'Keria', 'Deft', 'Uzi']);
    for (const seed of seeds) {
      const round = buildPlayerRound(left, question('playerByTeam'), createRng(seed));
      expect(round?.optionIds.every((id) => left.some((e) => e.id === id)) ?? true).toBe(true);
    }
  });

  it('gives up when too few names are left', () => {
    expect(
      buildPlayerRound(entities(['Faker', 'Keria']), question('playerByTeam'), createRng('s')),
    ).toBeUndefined();
  });

  it('never offers an excluded name', () => {
    const excluding = { ...question('playerByTeam'), exclude: ['Faker'] };
    for (const seed of seeds) {
      const round = buildPlayerRound(allNames('playerByTeam'), excluding, createRng(seed));
      expect(round?.optionIds).not.toContain('Faker');
    }
  });
});
