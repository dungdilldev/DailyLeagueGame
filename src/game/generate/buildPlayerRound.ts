import type { PlayerQuestion } from '../../data/questions';
import type { Player, PlayerRole } from '../../data/playerSchema';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

type Ask = PlayerQuestion['ask'];

/** The text in each kind of question that is replaced by what the round is about. */
const PLACEHOLDERS: Partial<Record<Ask, string>> = {
  playerByTeam: '{team}',
  teamByPlayer: '{player}',
  playerByNickname: '{nickname}',
  playerByRegion: '{region}',
  playerByRole: '{role}',
};

/** How a role reads in a question: "Which of these players is best known as a {role}?" */
const ROLE_NAMES: Record<PlayerRole, string> = {
  top: 'top laner',
  jungle: 'jungler',
  mid: 'mid laner',
  bot: 'bot laner',
  support: 'support',
};

interface Matchup {
  /** What the question names (a team, player, nickname, region or role); empty if nothing. */
  subject: string;
  /** Options that are right for it, and options that are wrong for it. */
  right: readonly string[];
  wrong: readonly string[];
}

const nameOf = ({ name }: Player) => name;

function nicknameMatchups(players: readonly Player[]): Matchup[] {
  return players.flatMap(({ name, nickname }) =>
    nickname === undefined
      ? []
      : [
          {
            subject: nickname,
            right: [name],
            wrong: players.filter((other) => other.nickname !== nickname).map(nameOf),
          },
        ],
  );
}

function teamByPlayerMatchups(players: readonly Player[]): Matchup[] {
  const allTeams = [...new Set(players.flatMap(({ teams }) => teams))];
  return players.map(({ name, teams }) => ({
    subject: name,
    right: teams,
    wrong: allTeams.filter((team) => !teams.includes(team)),
  }));
}

function playerByTeamMatchups(players: readonly Player[]): Matchup[] {
  const allTeams = [...new Set(players.flatMap(({ teams }) => teams))];
  return allTeams.map((team) => ({
    subject: team,
    right: players.filter(({ teams }) => teams.includes(team)).map(nameOf),
    wrong: players.filter(({ teams }) => !teams.includes(team)).map(nameOf),
  }));
}

/**
 * A player listed under another region may still have made a name there (Viper won Worlds with a
 * Chinese team), so a wrong option must also never have played for a team of that region's players.
 */
function regionMatchups(players: readonly Player[]): Matchup[] {
  const regions = [...new Set(players.map(({ region }) => region))];
  return regions.map((region) => {
    const fromRegion = players.filter((player) => player.region === region);
    const regionTeams = new Set(fromRegion.flatMap(({ teams }) => teams));
    const elsewhere = players.filter(
      (player) => player.region !== region && !player.teams.some((team) => regionTeams.has(team)),
    );
    return { subject: region, right: fromRegion.map(nameOf), wrong: elsewhere.map(nameOf) };
  });
}

function roleMatchups(players: readonly Player[]): Matchup[] {
  return Object.entries(ROLE_NAMES).map(([role, roleName]) => ({
    subject: roleName,
    right: players.filter((player) => player.role === role).map(nameOf),
    wrong: players.filter((player) => player.role !== role).map(nameOf),
  }));
}

/** "Has won Worlds" has one matchup; "has never won Worlds" is the same with the sides swapped. */
function titleMatchups(question: PlayerQuestion, players: readonly Player[]): Matchup[] {
  const won = (player: Player) => player.titles.some(({ event }) => event === question.event);
  const winners = players.filter(won).map(nameOf);
  const others = players.filter((player) => !won(player)).map(nameOf);
  return question.ask === 'playerWithTitle'
    ? [{ subject: '', right: winners, wrong: others }]
    : [{ subject: '', right: others, wrong: winners }];
}

function allMatchups(question: PlayerQuestion): Matchup[] {
  const { players } = question;
  switch (question.ask) {
    case 'playerByNickname':
      return nicknameMatchups(players);
    case 'teamByPlayer':
      return teamByPlayerMatchups(players);
    case 'playerByTeam':
      return playerByTeamMatchups(players);
    case 'playerByRegion':
      return regionMatchups(players);
    case 'playerByRole':
      return roleMatchups(players);
    case 'playerWithTitle':
    case 'playerWithoutTitle':
      return titleMatchups(question, players);
  }
}

/**
 * Every subject the question could be about, with the options that fit it and those that do not,
 * keeping only names in `available` (not used earlier in the day) and not excluded. Wrong options
 * rely on the player file being complete, see CLAUDE.md.
 */
function matchups(question: PlayerQuestion, available: ReadonlySet<string>): Matchup[] {
  const excluded = new Set(question.exclude);
  const usable = (names: readonly string[]) =>
    names.filter((name) => available.has(name) && !excluded.has(name));
  return allMatchups(question).map(({ subject, right, wrong }) => ({
    subject,
    right: usable(right),
    wrong: usable(wrong),
  }));
}

/**
 * Builds a round about players: one right option and three wrong ones for a random team, player,
 * nickname, region, role or title. `entities` are the names still available; returns undefined
 * if nothing the question could be about has enough options left.
 */
export function buildPlayerRound(
  entities: readonly Entity[],
  question: PlayerQuestion,
  rng: Rng,
): Round | undefined {
  const available = new Set(entities.map(({ id }) => id));
  const placeholder = PLACEHOLDERS[question.ask];

  for (const { subject, right, wrong } of rng.shuffle(matchups(question, available))) {
    const answer = rng.shuffle(right)[0];
    const others = rng.shuffle(wrong).slice(0, OPTIONS_PER_ROUND - 1);
    if (!answer || others.length < OPTIONS_PER_ROUND - 1) continue;

    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.label,
      question:
        placeholder === undefined
          ? question.question
          : question.question.replace(placeholder, subject),
      optionIds: rng.shuffle([answer, ...others]),
      answerId: answer,
      values: {},
    };
  }
  return undefined;
}
