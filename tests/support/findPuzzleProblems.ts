import type { Question } from '../../src/data/questions';
import type { Entity } from '../../src/data/schema';
import { gapRatio } from '../../src/game/generate/buildRound';
import { ROUND_GAP_BANDS, type GapBand } from '../../src/game/generate/config';
import type { Puzzle } from '../../src/game/puzzle';

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
      if (!entitiesById.has(id)) problems.push(`${label}: unknown option "${id}"`);
      if (excluded.has(id)) problems.push(`${label}: "${id}" is excluded for this question`);
      if (seenChampions.has(id)) problems.push(`${label}: "${id}" appears twice in the day`);
      seenChampions.add(id);
    }
    const { correct, wrong } = question;
    if (correct && !correct.includes(round.answerId)) {
      problems.push(`${label}: answer is not in the question's correct list`);
    }
    if (wrong && round.optionIds.some((id) => id !== round.answerId && !wrong.includes(id))) {
      problems.push(`${label}: an option is not in the question's wrong list`);
    }
    if (question.kind === 'pick') return;

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
