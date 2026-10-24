import type { Player } from './playerSchema';
import type {
  AbilityDataFile,
  ChampionDataFile,
  ClueQuestionTemplate,
  ItemDataFile,
  PickQuestionTemplate,
  PlayerQuestionTemplate,
  QuestionTemplate,
  StatMeta,
  StatQuestionTemplate,
  StatSubject,
  LogoQuestionTemplate,
  SkinLineQuestionTemplate,
  YearQuestionTemplate,
} from './schema';
import { StatSubjectSchema } from './schema';

/** A question about the highest value of a stat, tied to the stat it asks about. */
export interface StatQuestion extends StatQuestionTemplate {
  kind: 'stat';
  /** Whether the options are champions, items or abilities; follows from the data file holding the stat. */
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

/** A question with one answer per year; the answers come with the template. */
export interface YearQuestion extends YearQuestionTemplate {
  kind: 'yearly';
}

/** A question about the champions' esports skin lines, made from the champion data. */
export interface SkinLineQuestion extends SkinLineQuestionTemplate {
  kind: 'skinLine';
}

/** A question that shows a team's logo and asks whose it is. */
export interface LogoQuestion extends LogoQuestionTemplate {
  kind: 'logo';
}

export type Question =
  | StatQuestion
  | PickQuestion
  | ClueQuestion
  | PlayerQuestion
  | YearQuestion
  | SkinLineQuestion
  | LogoQuestion;

/** Short name of a question, e.g. "Base health" or "Marksmen". */
export function questionLabel(question: Question): string {
  return question.kind === 'stat' ? question.statMeta.label : question.label;
}

type StatsBySubject = Record<StatSubject, readonly StatMeta[]>;

function resolveStatQuestion(template: StatQuestionTemplate, stats: StatsBySubject): StatQuestion {
  for (const subject of StatSubjectSchema.options) {
    const statMeta = stats[subject].find((stat) => stat.id === template.stat);
    if (statMeta) return { ...template, kind: 'stat', subject, statMeta };
  }
  throw new Error(`Question "${template.id}" uses unknown stat "${template.stat}"`);
}

/**
 * Throws if a stat question names a stat that no data file defines. `players` are what
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
    if ('byYear' in template) return { ...template, kind: 'yearly' };
    if ('skinLine' in template) return { ...template, kind: 'skinLine' };
    if ('logo' in template) return { ...template, kind: 'logo' };
    return { ...template, kind: 'pick' };
  });
}

/** Everything the game needs: the data files and the questions asked about them. */
export interface GameData {
  champions: ChampionDataFile;
  items: ItemDataFile;
  abilities: AbilityDataFile;
  questions: Question[];
}
