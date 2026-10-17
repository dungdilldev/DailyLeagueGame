import type { Question } from '../../data/questions';
import type { Entity, StatSubject } from '../../data/schema';
import type { PuzzleData } from './buildPuzzle';

/** A plain-text option: the name is the id and there is no icon or data behind it. */
function textOption(name: string): Entity {
  return { id: name, name, iconUrl: '', stats: {} };
}

/** The champions or items a question of this subject compares. */
function entitiesFor(data: PuzzleData, subject: StatSubject): readonly Entity[] {
  return subject === 'item' ? data.items : data.champions;
}

/** Everything a question may pick its options from, before anything is ruled out. */
export function optionPool(data: PuzzleData, question: Question): readonly Entity[] {
  if (question.kind === 'pick' && question.subject === 'text') {
    return [...question.correct, ...question.wrong].map(textOption);
  }
  return entitiesFor(data, question.subject === 'item' ? 'item' : 'champion');
}
