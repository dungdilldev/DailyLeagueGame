import { describe, expect, it } from 'vitest';
import type { PlayerQuestion } from '../../../src/data/questions';
import type { Player } from '../../../src/data/playerSchema';
import type { Entity } from '../../../src/data/schema';
import { buildPlayerRound } from '../../../src/game/generate/buildPlayerRound';
import { createRng } from '../../../src/game/generate/random';

const player = (name: string, teams: string[], details: Partial<Player> = {}): Player => ({
  name,
  region: 'Korea',
  role: 'mid',
  titles: [],
  teams,
  ...details,
});
const worlds = [{ event: 'Worlds' as const, year: 2023 }];
const msi = [{ event: 'MSI' as const, year: 2019 }];

const players = [
  player('Faker', ['T1'], { nickname: 'Unkillable Demon King', titles: worlds }),
  player('Keria', ['DRX', 'T1'], {
    nickname: 'The Genius Monster',
    role: 'support',
    titles: worlds,
  }),
  // A Korean who played in China: never a wrong option for "made their name in China".
  player('Deft', ['DRX', 'KT Rolster', 'Edward Gaming'], { role: 'bot', titles: worlds }),
  player('Uzi', ['Royal Never Give Up', 'Edward Gaming'], {
    region: 'China',
    role: 'bot',
    titles: msi,
  }),
  player('Caps', ['Fnatic', 'G2 Esports'], {
    nickname: 'Baby Faker',
    region: 'Europe',
    titles: msi,
  }),
  player('Perkz', ['G2 Esports', 'Cloud9'], { region: 'Europe', titles: msi }),
];

const question = (ask: PlayerQuestion['ask']): PlayerQuestion => ({
  kind: 'player',
  id: ask,
  category: 'esports',
  difficulty: 'medium',
  subject: 'text',
  label: 'Players and teams',
  ask,
  ...(ask === 'playerWithTitle' || ask === 'playerWithoutTitle'
    ? { event: 'Worlds' as const }
    : {}),
  question: {
    playerByTeam: 'Which player has played for {team}?',
    teamByPlayer: 'Which team has {player} played for?',
    playerByNickname: 'Which player is nicknamed "{nickname}"?',
    playerByRegion: 'Which player made their name in {region}?',
    playerByRole: 'Which player is best known as a {role}?',
    playerWithTitle: 'Which player has won Worlds?',
    playerWithoutTitle: 'Which player has never won Worlds?',
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
      players: players.map((p) => ({ ...p, nickname: undefined })),
    };
    expect(buildPlayerRound(allNames('playerByNickname'), nobody, createRng('s'))).toBeUndefined();
  });

  it('names a region and offers a player from it, never one who played for a team there', () => {
    for (const seed of seeds) {
      const round = buildPlayerRound(
        allNames('playerByRegion'),
        question('playerByRegion'),
        createRng(seed),
      );
      const region = round?.question.match(/name in (.+)\?/)?.[1];
      if (round === undefined) continue;
      expect(players.find((p) => p.name === round.answerId)?.region).toBe(region);
      const others = round.optionIds.filter((id) => id !== round.answerId);
      expect(others.map((id) => players.find((p) => p.name === id)?.region)).not.toContain(region);
      if (region === 'China') expect(others).not.toContain('Deft');
    }
  });

  it('names a role in words and offers one player with it and three without', () => {
    const roleNames = { mid: 'mid laner', support: 'support', bot: 'bot laner' };
    for (const seed of seeds) {
      const round = buildPlayerRound(
        allNames('playerByRole'),
        question('playerByRole'),
        createRng(seed),
      );
      const named = round?.question.match(/known as a (.+)\?/)?.[1];
      const roleOf = (id: string) => {
        const role = players.find((p) => p.name === id)?.role;
        return role && roleNames[role as keyof typeof roleNames];
      };
      expect(roleOf(round?.answerId ?? '')).toBe(named);
      expect(round?.optionIds.filter((id) => roleOf(id) === named)).toHaveLength(1);
    }
  });

  it('asks who has won the event, or who never has, with the other side as wrong options', () => {
    const champions = ['Faker', 'Keria', 'Deft'];
    for (const seed of seeds) {
      const won = buildPlayerRound(
        allNames('playerWithTitle'),
        question('playerWithTitle'),
        createRng(seed),
      );
      expect(champions).toContain(won?.answerId);
      expect(won?.optionIds.filter((id) => champions.includes(id))).toHaveLength(1);
      expect(won?.question).toBe('Which player has won Worlds?');
      const never = buildPlayerRound(
        allNames('playerWithoutTitle'),
        question('playerWithoutTitle'),
        createRng(seed),
      );
      expect(champions).not.toContain(never?.answerId);
      expect(never?.optionIds.filter((id) => !champions.includes(id))).toHaveLength(1);
    }
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
