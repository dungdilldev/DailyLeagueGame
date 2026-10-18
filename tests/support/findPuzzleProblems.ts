import type { PlayerQuestion, Question, WinnerQuestion } from '../../src/data/questions';
import type { Entity } from '../../src/data/schema';
import { gapRatio } from '../../src/game/generate/buildRound';
import { ROUND_GAP_BANDS, type GapBand } from '../../src/game/generate/config';
import type { Puzzle, Round } from '../../src/game/puzzle';

/** What replaced the placeholder in a finished question text (a team, a player or a year). */
function namedSubject(round: Round, template: string, placeholder: string): string {
  const [before = '', after = ''] = template.split(placeholder);
  return round.question.slice(before.length, round.question.length - after.length);
}

/** A winner round is valid if the answer won that year and no other option did. */
function findWinnerRoundProblems(round: Round, question: WinnerQuestion, label: string): string[] {
  const year = Number(namedSubject(round, question.question, '{year}'));
  const wonThatYear = (team: string) =>
    question.winners.some((winner) => winner.year === year && winner.team === team);
  const problems: string[] = [];
  if (!wonThatYear(round.answerId)) {
    problems.push(`${label}: the answer did not win in ${String(year)}`);
  }
  for (const id of round.optionIds.filter((option) => option !== round.answerId)) {
    if (wonThatYear(id)) problems.push(`${label}: "${id}" also won in ${String(year)}`);
  }
  return problems;
}

/** A player round is valid if the named team or player fits the answer and none of the other options. */
function findPlayerRoundProblems(round: Round, question: PlayerQuestion, label: string): string[] {
  const placeholders = {
    playerByTeam: '{team}',
    teamByPlayer: '{player}',
    playerByNickname: '{nickname}',
  };
  const subject = namedSubject(round, question.question, placeholders[question.ask]);
  const fitsByAsk = {
    playerByTeam: (option: string) =>
      question.players.some((player) => player.name === option && player.teams.includes(subject)),
    teamByPlayer: (option: string) =>
      question.players.some((player) => player.name === subject && player.teams.includes(option)),
    playerByNickname: (option: string) =>
      question.players.some((player) => player.name === option && player.nickname === subject),
  };
  const fits = fitsByAsk[question.ask];
  const problems: string[] = [];
  if (!fits(round.answerId)) problems.push(`${label}: the answer does not fit the question`);
  for (const id of round.optionIds.filter((option) => option !== round.answerId)) {
    if (fits(id)) problems.push(`${label}: "${id}" also fits the question`);
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
    if (question.kind === 'winner') {
      problems.push(...findWinnerRoundProblems(round, question, label));
      return;
    }
    if (question.kind === 'player') {
      problems.push(...findPlayerRoundProblems(round, question, label));
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
