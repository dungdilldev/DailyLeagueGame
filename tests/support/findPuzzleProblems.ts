import type { PlayerQuestion, Question, YearQuestion } from '../../src/data/questions';
import type { Entity } from '../../src/data/schema';
import { gapRatio } from '../../src/game/generate/buildRound';
import { ROUND_GAP_BANDS, type GapBand } from '../../src/game/generate/config';
import type { Puzzle, Round } from '../../src/game/puzzle';

/** What replaced the placeholder in a finished question text (a team, a player or a year). */
function namedSubject(round: Round, template: string, placeholder: string): string {
  const [before = '', after = ''] = template.split(placeholder);
  return round.question.slice(before.length, round.question.length - after.length);
}

/** A round about a given year is valid if the answer is that year's and no other option is. */
function findYearRoundProblems(round: Round, question: YearQuestion, label: string): string[] {
  const year = Number(namedSubject(round, question.question, '{year}'));
  const answersThatYear = (option: string) =>
    question.byYear.some((entry) => entry.year === year && entry.answer === option);
  const problems: string[] = [];
  if (!answersThatYear(round.answerId)) {
    problems.push(`${label}: the answer is not the one for ${String(year)}`);
  }
  for (const id of round.optionIds.filter((option) => option !== round.answerId)) {
    if (answersThatYear(id)) problems.push(`${label}: "${id}" is also right for ${String(year)}`);
  }
  return problems;
}

/** The role each role question names, written out independently of the generator. */
const ROLE_BY_NAME: Readonly<Record<string, string>> = {
  'top laner': 'top',
  jungler: 'jungle',
  'mid laner': 'mid',
  'bot laner': 'bot',
  support: 'support',
};

/**
 * For each kind of player question: whether an option is right (`fits`) and whether a wrong
 * option could be argued to be right (`arguable`, stricter where the data is fuzzy).
 */
function playerChecks(question: PlayerQuestion, subject: string) {
  const { players } = question;
  const find = (name: string) => players.find((player) => player.name === name);
  const hasTitle = (name: string) =>
    find(name)?.titles.some(({ event }) => event === question.event) ?? false;
  const regionTeams = new Set(
    players.filter(({ region }) => region === subject).flatMap(({ teams }) => teams),
  );
  const checks: Record<PlayerQuestion['ask'], (option: string) => boolean> = {
    playerByTeam: (option) => find(option)?.teams.includes(subject) ?? false,
    teamByPlayer: (option) => find(subject)?.teams.includes(option) ?? false,
    playerByNickname: (option) => find(option)?.nickname === subject,
    playerByRegion: (option) => find(option)?.region === subject,
    playerByRole: (option) => find(option)?.role === ROLE_BY_NAME[subject],
    playerWithTitle: hasTitle,
    playerWithoutTitle: (option) => find(option) !== undefined && !hasTitle(option),
  };
  const fits = checks[question.ask];
  const arguable =
    question.ask === 'playerByRegion'
      ? (option: string) =>
          fits(option) || (find(option)?.teams.some((team) => regionTeams.has(team)) ?? false)
      : fits;
  return { fits, arguable };
}

const PLAYER_PLACEHOLDERS: Partial<Record<PlayerQuestion['ask'], string>> = {
  playerByTeam: '{team}',
  teamByPlayer: '{player}',
  playerByNickname: '{nickname}',
  playerByRegion: '{region}',
  playerByRole: '{role}',
};

/** A player round is valid if the answer fits the question and none of the other options could. */
function findPlayerRoundProblems(round: Round, question: PlayerQuestion, label: string): string[] {
  const placeholder = PLAYER_PLACEHOLDERS[question.ask];
  const subject =
    placeholder === undefined ? '' : namedSubject(round, question.question, placeholder);
  const { fits, arguable } = playerChecks(question, subject);
  const problems: string[] = [];
  if (!fits(round.answerId)) problems.push(`${label}: the answer does not fit the question`);
  for (const id of round.optionIds.filter((option) => option !== round.answerId)) {
    if (arguable(id)) problems.push(`${label}: "${id}" also fits the question`);
  }
  return problems;
}

/**
 * Independent re-check of a generated puzzle against the champion and item data it came from.
 * Deliberately shares no logic with the generator beyond the gap formula. Empty result = valid.
 */
export function findPuzzleProblems(
  puzzle: Puzzle,
  entities: readonly Entity[],
  questions: readonly Question[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): string[] {
  const problems: string[] = [];
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const seenChampions = new Set<string>();
  const seenQuestions = new Set<string>();

  if (puzzle.rounds.length !== bands.length) {
    problems.push(`Expected ${String(bands.length)} rounds, got ${String(puzzle.rounds.length)}`);
  }

  puzzle.rounds.forEach((round, index) => {
    const label = `Round ${String(index + 1)}`;

    if (seenQuestions.has(round.questionId)) {
      problems.push(`${label}: question "${round.questionId}" repeated`);
    }
    seenQuestions.add(round.questionId);

    const question = questions.find(({ id }) => id === round.questionId);
    if (!question) {
      problems.push(`${label}: unknown question "${round.questionId}"`);
      return;
    }
    const excluded = new Set(question.exclude);

    if (round.optionIds.length !== 4) problems.push(`${label}: not 4 options`);
    if (new Set(round.optionIds).size !== round.optionIds.length) {
      problems.push(`${label}: repeated option`);
    }
    if (!round.optionIds.includes(round.answerId)) problems.push(`${label}: answer not offered`);
    for (const id of round.optionIds) {
      // Text options are written in the question, not in the data.
      if (question.subject !== 'text' && !entitiesById.has(id)) {
        problems.push(`${label}: unknown option "${id}"`);
      }
      if (excluded.has(id)) problems.push(`${label}: "${id}" is excluded for this question`);
      if (seenChampions.has(id)) problems.push(`${label}: "${id}" appears twice in the day`);
      seenChampions.add(id);
    }
    const correct = 'correct' in question ? question.correct : undefined;
    const wrong = 'wrong' in question ? question.wrong : undefined;
    if (correct && !correct.includes(round.answerId)) {
      problems.push(`${label}: answer is not in the question's correct list`);
    }
    if (wrong && round.optionIds.some((id) => id !== round.answerId && !wrong.includes(id))) {
      problems.push(`${label}: an option is not in the question's wrong list`);
    }
    if (question.kind === 'clue') {
      // The quoted clue must belong to the answer, or the question would be unanswerable.
      const title = entitiesById.get(round.answerId)?.title;
      if (!title || !round.question.includes(title)) {
        problems.push(`${label}: question does not quote the answer's title`);
      }
      return;
    }
    if (question.kind === 'pick') return;
    if (question.kind === 'yearly') {
      problems.push(...findYearRoundProblems(round, question, label));
      return;
    }
    if (question.kind === 'player') {
      problems.push(...findPlayerRoundProblems(round, question, label));
      return;
    }
    if (question.kind === 'logo') {
      if (round.clue !== 'teamLogo') problems.push(`${label}: the logo is not shown`);
      if (round.optionIds.some((id) => !question.teams.includes(id))) {
        problems.push(`${label}: an option is not in the question's team list`);
      }
      return;
    }
    if (question.kind === 'skinLine') {
      const line = namedSubject(round, question.question, '{line}');
      const hasLine = (id: string) => entitiesById.get(id)?.esportsSkinLines?.includes(line);
      if (!hasLine(round.answerId)) problems.push(`${label}: the answer has no ${line} skin`);
      for (const id of round.optionIds.filter((option) => option !== round.answerId)) {
        if (hasLine(id)) problems.push(`${label}: "${id}" also has a ${line} skin`);
      }
      return;
    }

    const values: number[] = [];
    for (const id of round.optionIds) {
      const stored = entitiesById.get(id)?.stats[question.stat];
      if (stored === undefined) {
        problems.push(`${label}: unknown option or stat for "${id}"`);
        continue;
      }
      if (round.values[id] !== stored) {
        problems.push(`${label}: value for "${id}" does not match data`);
      }
      values.push(stored);
    }

    const sorted = [...values].sort((a, b) => b - a);
    const [best, second] = sorted;
    if (best === undefined || second === undefined || best === second) {
      problems.push(`${label}: no unique highest value`);
      return;
    }
    if (round.values[round.answerId] !== best) problems.push(`${label}: answer is not the highest`);
    if (new Set(values).size !== values.length) problems.push(`${label}: tied values`);

    const band = bands[index];
    const ratio = gapRatio(best, second);
    if (band && (ratio < band.minRatio || ratio > band.maxRatio)) {
      problems.push(`${label}: gap ${ratio.toFixed(3)} outside difficulty band`);
    }
  });
  return problems;
}
