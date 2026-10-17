import type {
  ChampionDataFile,
  ItemDataFile,
  QuestionTemplate,
  StatMeta,
  StatSubject,
} from './schema';

/** A question template tied to the stat it asks about. */
export interface Question extends QuestionTemplate {
  /** Whether the options are champions or items; follows from the data file holding the stat. */
  subject: StatSubject;
  statMeta: StatMeta;
}

type StatsBySubject = Record<StatSubject, readonly StatMeta[]>;

/** Throws if a template names a stat that neither data file defines. */
export function resolveQuestions(
  templates: readonly QuestionTemplate[],
  stats: StatsBySubject,
): Question[] {
  return templates.map((template) => {
    for (const subject of ['champion', 'item'] as const) {
      const statMeta = stats[subject].find((stat) => stat.id === template.stat);
      if (statMeta) return { ...template, subject, statMeta };
    }
    throw new Error(`Question "${template.id}" uses unknown stat "${template.stat}"`);
  });
}

/** Everything the game needs: both data files and the questions asked about them. */
export interface GameData {
  champions: ChampionDataFile;
  items: ItemDataFile;
  questions: Question[];
}
