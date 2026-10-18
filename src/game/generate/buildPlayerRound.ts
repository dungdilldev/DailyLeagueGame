import type { PlayerQuestion } from '../../data/questions';
import type { Entity } from '../../data/schema';
import { OPTIONS_PER_ROUND, type Round } from '../puzzle';
import type { Rng } from './random';

/** The text in each kind of question that is replaced by what the round is about. */
const PLACEHOLDERS: Record<PlayerQuestion['ask'], string> = {
  playerByTeam: '{team}',
  teamByPlayer: '{player}',
  playerByNickname: '{nickname}',
};

interface Matchup {
  /** What the question names: a team, a player or a nickname. */
  subject: string;
  /** Options that are right for it, and options that are wrong for it. */
  right: readonly string[];
  wrong: readonly string[];
}

/**
 * Every team, player or nickname the question could be about, with the options that fit it and
 * those that do not. Only names in `available` (not used earlier in the day) count as options.
 * Wrong options rely on `teams` and `nickname` in the player file being complete, see CLAUDE.md.
 */
function matchups(question: PlayerQuestion, available: ReadonlySet<string>): Matchup[] {
  const { players } = question;
  const excluded = new Set(question.exclude);
  const usable = (names: readonly string[]) =>
    names.filter((name) => available.has(name) && !excluded.has(name));
  const names = players.map(({ name }) => name);

  if (question.ask === 'playerByNickname') {
    return players.flatMap(({ name, nickname }) =>
      nickname === undefined
        ? []
        : [
            {
              subject: nickname,
              right: usable([name]),
              wrong: usable(
                players.filter((other) => other.nickname !== nickname).map((other) => other.name),
              ),
            },
          ],
    );
  }

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
    return {
      subject: team,
      right: usable(names.filter(played)),
      wrong: usable(names.filter((name) => !played(name))),
    };
  });
}

/**
 * Builds a round about players: one right option and three wrong ones for a random team, player
 * or nickname. `entities` are the names still available; returns undefined if nothing the
 * question could be about has enough options left.
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
      question: question.question.replace(placeholder, subject),
      optionIds: rng.shuffle([answer, ...others]),
      answerId: answer,
      values: {},
    };
  }
  return undefined;
}
