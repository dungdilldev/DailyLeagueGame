import type { Question } from '../../data/questions';
import type { Entity, StatSubject } from '../../data/schema';
import type { PuzzleData } from './buildPuzzle';

/** A plain-text option: the name is the id and there is no icon or data behind it. */
function textOption(name: string): Entity {
  return { id: name, name, iconUrl: '', stats: {} };
}

/** The champions, items or abilities a question of this subject compares. */
function entitiesFor(data: PuzzleData, subject: StatSubject): readonly Entity[] {
  const bySubject: Record<StatSubject, readonly Entity[]> = {
    champion: data.champions,
    item: data.items,
    ability: data.abilities,
  };
  return bySubject[subject];
}

/** Everything a question may pick its options from, before anything is ruled out. */
export function optionPool(data: PuzzleData, question: Question): readonly Entity[] {
  if (question.kind === 'player') {
    const names =
      question.ask !== 'teamByPlayer'
        ? question.players.map(({ name }) => name)
        : question.players.flatMap(({ teams }) => teams);
    return [...new Set(names)].map(textOption);
  }
  if (question.kind === 'winner') {
    return [...new Set(question.winners.map(({ team }) => team))].map(textOption);
  }
  if (question.subject === 'text') {
    return [...question.correct, ...question.wrong].map(textOption);
  }
  return entitiesFor(data, question.subject);
}
