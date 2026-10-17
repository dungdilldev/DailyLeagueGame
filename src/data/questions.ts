import type {
  ChampionDataFile,
  ItemDataFile,
  PickQuestionTemplate,
  QuestionTemplate,
  StatMeta,
  StatQuestionTemplate,
  StatSubject,
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

export type Question = StatQuestion | PickQuestion;

/** Short name of a question, e.g. "Base health" or "Marksmen". */
export function questionLabel(question: Question): string {
  return question.kind === 'pick' ? question.label : question.statMeta.label;
}

type StatsBySubject = Record<StatSubject, readonly StatMeta[]>;

function resolveStatQuestion(template: StatQuestionTemplate, stats: StatsBySubject): StatQuestion {
  for (const subject of ['champion', 'item'] as const) {
    const statMeta = stats[subject].find((stat) => stat.id === template.stat);
    if (statMeta) return { ...template, kind: 'stat', subject, statMeta };
  }
  throw new Error(`Question "${template.id}" uses unknown stat "${template.stat}"`);
}

/** Throws if a stat question names a stat that neither data file defines. */
export function resolveQuestions(
  templates: readonly QuestionTemplate[],
  stats: StatsBySubject,
): Question[] {
  return templates.map((template) =>
    'stat' in template ? resolveStatQuestion(template, stats) : { ...template, kind: 'pick' },
  );
}

/** Everything the game needs: both data files and the questions asked about them. */
export interface GameData {
  champions: ChampionDataFile;
  items: ItemDataFile;
  questions: Question[];
}
