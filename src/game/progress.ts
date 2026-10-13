import type { Puzzle, Round } from '../data/puzzleSchema';

export function isCorrect(round: Round, chosenId: string): boolean {
  return round.answerId === chosenId;
}

export function isComplete(puzzle: Puzzle, answers: readonly string[]): boolean {
  return answers.length >= puzzle.rounds.length;
}

/** Returns the answers with `chosenId` recorded for the current round. Does not mutate. */
export function submitAnswer(
  puzzle: Puzzle,
  answers: readonly string[],
  chosenId: string,
): string[] {
  const round = puzzle.rounds[answers.length];
  if (!round) throw new Error('Puzzle is already complete');
  if (!round.championIds.includes(chosenId)) {
    throw new Error(`"${chosenId}" is not an option in this round`);
  }
  return [...answers, chosenId];
}

/** One entry per answered round: true if the player picked the right champion. */
export function roundResults(puzzle: Puzzle, answers: readonly string[]): boolean[] {
  return puzzle.rounds.slice(0, answers.length).map((round, i) => answers[i] === round.answerId);
}

export function score(puzzle: Puzzle, answers: readonly string[]): number {
  return roundResults(puzzle, answers).filter(Boolean).length;
}
