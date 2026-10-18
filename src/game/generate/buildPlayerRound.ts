import type { PlayerQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

const TEAM_PLACEHOLDER = '{team}';
const PLAYER_PLACEHOLDER = '{player}';

interface Matchup {
  /** What the question names: a team or a player. */
  subject: string;
  /** Options that are right for it, and options that are wrong for it. */
  right: readonly string[];
  wrong: readonly string[];
}

/**
 * Every team (or player) the question could be about, with the options that fit it and those
 * that do not. Only names in `available` (not used earlier in the day) count as options.
 * Wrong options rely on `teams` in the player file being complete, see CLAUDE.md.
 */
function matchups(question: PlayerQuestion, available: ReadonlySet<string>): Matchup[] {
  const { players } = question;
  const excluded = new Set(question.exclude);
  const usable = (names: readonly string[]) =>
    names.filter((name) => available.has(name) && !excluded.has(name));
  const allTeams = [...new Set(players.flatMap(({ teams }) => teams))];

  if (question.ask === 'teamByPlayer') {
    return players.map(({ name, teams }) => ({
      subject: name,
      right: usable(teams),
      wrong: usable(allTeams.filter((team) => !teams.includes(team))),
    }));
  }
  return allTeams.map((team) => {
    const played = (name: string) =>
      players.some((player) => player.name === name && player.teams.includes(team));
    const names = players.map(({ name }) => name);
    return {
      subject: team,
      right: usable(names.filter(played)),
      wrong: usable(names.filter((name) => !played(name))),
    };
  });
}

/**
 * Builds a round about players and their teams: one right option and three wrong ones for a
 * random team or player. `entities` are the names still available; returns undefined if no
 * team or player has enough left.
 */
export function buildPlayerRound(
  entities: readonly Entity[],
  question: PlayerQuestion,
  rng: Rng,
): Round | undefined {
  const available = new Set(entities.map(({ id }) => id));
  const placeholder = question.ask === 'teamByPlayer' ? PLAYER_PLACEHOLDER : TEAM_PLACEHOLDER;

  for (const { subject, right, wrong } of rng.shuffle(matchups(question, available))) {
    const answer = rng.shuffle(right)[0];
    const others = rng.shuffle(wrong).slice(0, OPTIONS_PER_ROUND - 1);
    if (!answer || others.length < OPTIONS_PER_ROUND - 1) continue;

    return {
      questionId: question.id,
      subject: question.subject,
      statLabel: question.label,
      question: question.question.replace(placeholder, subject),
      optionIds: rng.shuffle([answer, ...others]),
      answerId: answer,
      values: {},
    };
  }
  return undefined;
}
