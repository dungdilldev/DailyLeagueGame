import { z } from 'zod';

/** Stat ids are defined by the stat lists in `pipeline/stats`; the client treats them as opaque. */
export type StatId = string;

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** What a question is about: each round compares champions with champions, or items with items. */
export const StatSubjectSchema = z.enum(['champion', 'item']);
export type StatSubject = z.infer<typeof StatSubjectSchema>;

/**
 * What the options of a round are. `text` options are written out in the question itself
 * (team names, players, cities): they have no data file and no icon, their id is their name.
 */
export const OptionSubjectSchema = z.enum(['champion', 'item', 'text']);
export type OptionSubject = z.infer<typeof OptionSubjectSchema>;

/** How a stat's number is shown to the player. */
export const StatFormatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('number') }),
  /** A percentage such as 103.6, shown with a % sign. */
  z.object({ kind: z.literal('percent') }),
  /** The number is a count of days since `epoch` (ISO date), shown as a calendar date. */
  z.object({ kind: z.literal('date'), epoch: IsoDateSchema }),
]);
export type StatFormat = z.infer<typeof StatFormatSchema>;

/** Everything the game needs to know about a stat besides the values themselves. */
export const StatMetaSchema = z.object({
  id: z.string().min(1),
  /** Shown to the player, e.g. "Base health". */
  label: z.string().min(1),
  format: StatFormatSchema,
  /** Where the values came from, so wrong-looking numbers can be traced. */
  source: z.string().min(1),
});
export type StatMeta = z.infer<typeof StatMetaSchema>;

/** Something the player can pick: a champion or an item. */
const EntityFields = {
  /** Stable id: Data Dragon's champion id ("MissFortune") or item id ("3031"). */
  id: z.string().min(1),
  name: z.string().min(1),
  iconUrl: z.url(),
  /** Stat id -> value. A stat is absent when its source has no value for this entity. */
  stats: z.record(z.string(), z.number().nonnegative()),
};
export type Entity = {
  id: string;
  name: string;
  iconUrl: string;
  stats: Record<string, number>;
};

export const ChampionSchema = z.object({
  ...EntityFields,
  title: z.string(),
  /** Data Dragon "tags": champion classes such as Mage or Assassin (not lanes). */
  classes: z.array(z.string()),
});
export type Champion = z.infer<typeof ChampionSchema>;

export const ItemSchema = z.object(EntityFields);
export type Item = z.infer<typeof ItemSchema>;

/**
 * One data file's content as of one patch. A snapshot is used for puzzle days from
 * `effectiveFrom` on, so a data update never changes the puzzle of a day that has already started.
 */
function snapshotSchema<T extends z.ZodType>(entity: T) {
  return z.object({
    /** Game patch the data was taken from, e.g. "16.20.1". */
    patch: z.string().min(1),
    /** First UTC day (YYYY-MM-DD) whose puzzle is generated from this snapshot. */
    effectiveFrom: IsoDateSchema,
    entities: z.array(entity),
  });
}

/** A published data file: the stats it holds plus the current (and any upcoming) snapshot. */
function dataFileSchema<T extends z.ZodType>(entity: T) {
  return z.object({
    stats: z.array(StatMetaSchema).min(1),
    snapshots: z.array(snapshotSchema(entity)).min(1),
  });
}

export const ChampionDataFileSchema = dataFileSchema(ChampionSchema);
export const ItemDataFileSchema = dataFileSchema(ItemSchema);

export interface Snapshot<T> {
  patch: string;
  effectiveFrom: string;
  entities: T[];
}
export interface DataFile<T> {
  stats: StatMeta[];
  snapshots: Snapshot<T>[];
}
export type ChampionDataFile = DataFile<Champion>;
export type ItemDataFile = DataFile<Item>;

const EntityIdListSchema = z.array(z.string().min(1)).min(1);

/** What kind of knowledge a question tests; for grouping and, later, filtering. */
export const QuestionCategorySchema = z.enum(['stats', 'lore', 'esports']);
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

/**
 * Which rounds of the day a question may appear in: easy ones early, hard ones late.
 * `variable` means any round, for questions whose difficulty comes from the numbers (the gap
 * between the best and second-best option) rather than from the question itself.
 */
export const QuestionDifficultySchema = z.enum(['easy', 'medium', 'hard', 'variable']);
export type QuestionDifficulty = z.infer<typeof QuestionDifficultySchema>;

const QuestionFields = {
  id: z.string().min(1),
  category: QuestionCategorySchema,
  difficulty: QuestionDifficultySchema,
  /** The question shown to the player. */
  question: z.string().min(1),
  /** Never used for this question, neither as the answer nor as a wrong option. */
  exclude: EntityIdListSchema.optional(),
};

/** Roles are exclusive: an id that is both right and wrong, or excluded, would be ambiguous. */
function hasDisjointLists({
  correct = [],
  wrong = [],
  exclude = [],
}: {
  correct?: string[] | undefined;
  wrong?: string[] | undefined;
  exclude?: string[] | undefined;
}): boolean {
  return (
    new Set([...correct, ...wrong, ...exclude]).size ===
    correct.length + wrong.length + exclude.length
  );
}
const DISJOINT_LISTS_MESSAGE = 'An id may appear in only one of correct, wrong and exclude';

/**
 * A question about the highest value of one stat. By default any champion or item that has the
 * stat can be the answer or a wrong option; the lists narrow that down.
 */
const StatQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    /** Id of a stat in the champion data file or the item data file. A higher value is right. */
    stat: z.string().min(1),
    /** If given, only these can be the right answer. */
    correct: EntityIdListSchema.optional(),
    /** If given, only these can be the wrong options. */
    wrong: EntityIdListSchema.optional(),
  })
  .refine(hasDisjointLists, { message: DISJOINT_LISTS_MESSAGE });

/** A round shows 4 options: the answer and this many wrong ones. */
const MIN_WRONG_PER_PICK_QUESTION = 3;

/**
 * A question with no stat behind it ("Which of these champions is a yordle?"). One option is
 * drawn from `correct` and the others from `wrong`, so both lists are written out in full. For
 * `text` options the lists hold the names shown to the player.
 */
const PickQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    /** Whether the options are champions, items or plain text. */
    subject: OptionSubjectSchema,
    /** Short name shown in the results, e.g. "Marksmen". */
    label: z.string().min(1),
    correct: EntityIdListSchema,
    wrong: z.array(z.string().min(1)).min(MIN_WRONG_PER_PICK_QUESTION),
  })
  .refine(hasDisjointLists, { message: DISJOINT_LISTS_MESSAGE });

/** One kind of question, hand-written in `data/questions.json`. */
export const QuestionTemplateSchema = z.union([
  StatQuestionTemplateSchema,
  PickQuestionTemplateSchema,
]);
export type QuestionTemplate = z.infer<typeof QuestionTemplateSchema>;
export type StatQuestionTemplate = z.infer<typeof StatQuestionTemplateSchema>;
export type PickQuestionTemplate = z.infer<typeof PickQuestionTemplateSchema>;

export const QuestionFileSchema = z
  .object({ questions: z.array(QuestionTemplateSchema).min(1) })
  .refine(({ questions }) => new Set(questions.map(({ id }) => id)).size === questions.length, {
    message: 'Question ids must be unique',
  });
export type QuestionFile = z.infer<typeof QuestionFileSchema>;
