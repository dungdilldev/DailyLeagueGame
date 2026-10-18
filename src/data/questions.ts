import type { Player } from './playerSchema';
import type {
  ChampionDataFile,
  ClueQuestionTemplate,
  ItemDataFile,
  PickQuestionTemplate,
  PlayerQuestionTemplate,
  QuestionTemplate,
  StatMeta,
  StatQuestionTemplate,
  StatSubject,
  WinnerQuestionTemplate,
} from './schema';

/** A question about the highest value of a stat, tied to the stat it asks about. */
export interface StatQuestion extends StatQuestionTemplate {
  kind: 'stat';
  /** Whether the options are champions or items; follows from the data file holding the stat. */
  subject: StatSubject;
  statMeta: StatMeta;
}

/** A question answered from explicit lists of right and wrong options; no stat is involved. */
export interface PickQuestion extends PickQuestionTemplate {
  kind: 'pick';
}

/** A question that quotes a clue taken from a random champion's data. */
export interface ClueQuestion extends ClueQuestionTemplate {
  kind: 'clue';
}

/**
 * A question about which players played for which teams. It carries the player data it is
 * built from, so the generator needs no third data source.
 */
export interface PlayerQuestion extends PlayerQuestionTemplate {
  kind: 'player';
  players: readonly Player[];
}

/** A question about who won a tournament in a given year; the winners come with the template. */
export interface WinnerQuestion extends WinnerQuestionTemplate {
  kind: 'winner';
}

export type Question = StatQuestion | PickQuestion | ClueQuestion | PlayerQuestion | WinnerQuestion;

/** Short name of a question, e.g. "Base health" or "Marksmen". */
export function questionLabel(question: Question): string {
  return question.kind === 'stat' ? question.statMeta.label : question.label;
}

type StatsBySubject = Record<StatSubject, readonly StatMeta[]>;

function resolveStatQuestion(template: StatQuestionTemplate, stats: StatsBySubject): StatQuestion {
  for (const subject of ['champion', 'item'] as const) {
    const statMeta = stats[subject].find((stat) => stat.id === template.stat);
    if (statMeta) return { ...template, kind: 'stat', subject, statMeta };
  }
  throw new Error(`Question "${template.id}" uses unknown stat "${template.stat}"`);
}

/**
 * Throws if a stat question names a stat that neither data file defines. `players` are what
 * the player questions are built from.
 */
export function resolveQuestions(
  templates: readonly QuestionTemplate[],
  stats: StatsBySubject,
  players: readonly Player[],
): Question[] {
  return templates.map((template): Question => {
    if ('stat' in template) return resolveStatQuestion(template, stats);
    if ('clue' in template) return { ...template, kind: 'clue' };
    if ('ask' in template) return { ...template, kind: 'player', players };
    if ('winners' in template) return { ...template, kind: 'winner' };
    return { ...template, kind: 'pick' };
  });
}

/** Everything the game needs: both data files and the questions asked about them. */
export interface GameData {
  champions: ChampionDataFile;
  items: ItemDataFile;
  questions: Question[];
}
