import { z } from 'zod';
import { PlayerTitleEventSchema } from './playerSchema';

/** Stat ids are defined by the stat lists in `pipeline/stats`; the client treats them as opaque. */
export type StatId = string;

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * What a question is about: each round compares champions with champions, items with items or
 * abilities with abilities.
 */
export const StatSubjectSchema = z.enum(['champion', 'item', 'ability']);
export type StatSubject = z.infer<typeof StatSubjectSchema>;

/**
 * What the options of a round are. `text` options are written out in the question itself
 * (team names, players, cities): they have no data file and no icon, their id is their name.
 */
export const OptionSubjectSchema = z.enum(['champion', 'item', 'ability', 'text']);
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

/** Something the player can pick: a champion, an item or an ability. */
const EntityFields = {
  /**
   * Stable id: Data Dragon's champion id ("MissFortune"), item id ("3031") or champion id plus
   * ability slot ("MissFortuneR").
   */
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
  /** A champion's epithet ("the Darkin Blade"); absent for items and text options. */
  title?: string;
  /** Esports skin lines a champion has a skin in ("Samsung Galaxy", "Worlds 2019"). */
  esportsSkinLines?: string[];
};

export const ChampionSchema = z.object({
  ...EntityFields,
  title: z.string(),
  /** Data Dragon "tags": champion classes such as Mage or Assassin (not lanes). */
  classes: z.array(z.string()),
  /**
   * Esports skin lines the champion has a skin in, from Data Dragon's skin names. Absent when
   * there are none, and in snapshots made before the field existed.
   */
  esportsSkinLines: z.array(z.string().min(1)).min(1).optional(),
});
export type Champion = z.infer<typeof ChampionSchema>;

export const ItemSchema = z.object(EntityFields);
export type Item = z.infer<typeof ItemSchema>;

/** A champion's Q, W, E or R; the name says whose ("Ahri Q · Orb of Deception"). */
export const AbilitySchema = z.object(EntityFields);
export type Ability = z.infer<typeof AbilitySchema>;

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
export const AbilityDataFileSchema = dataFileSchema(AbilitySchema);

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
export type AbilityDataFile = DataFile<Ability>;

const EntityIdListSchema = z.array(z.string().min(1)).min(1);

/** What kind of knowledge a question tests; for grouping and, later, filtering. */
export const QuestionCategorySchema = z.enum(['stats', 'lore', 'esports', 'trivia']);
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

/**
 * Which rounds of the day a question may appear in: easy ones early, hard ones late.
 * `variable` means any round, for questions whose difficulty comes from the numbers (the gap
 * between the best and second-best option) rather than from the question itself.
 */
export const QuestionDifficultySchema = z.enum(['easy', 'medium', 'hard', 'variable']);
export type QuestionDifficulty = z.infer<typeof QuestionDifficultySchema>;

/** Lowercase words joined by hyphens, so "Geography" or "geo graphy" typos fail loudly. */
const SUBCATEGORY_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const QuestionFields = {
  id: z.string().min(1),
  category: QuestionCategorySchema,
  /** Optional topic within the category (e.g. "geography"); groups questions in the testing mode. */
  subcategory: z.string().regex(SUBCATEGORY_PATTERN).optional(),
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

/**
 * A question made from the champion data itself: it quotes a clue about a random champion
 * ("Which champion is known as \"the Darkin Blade\"?") and offers that champion and three others.
 * The `{title}` in the question text is replaced by the clue.
 */
const ClueQuestionTemplateSchema = z.strictObject({
  ...QuestionFields,
  subject: z.literal('champion'),
  /** Which champion field is quoted. */
  clue: z.literal('title'),
  /** Short name shown in the results. */
  label: z.string().min(1),
});

/**
 * A question made from the champions' esports skins: "Which of these champions has a {line}
 * skin?". The answer has a skin in that line, the wrong options have none.
 */
const SkinLineQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    subject: z.literal('champion'),
    skinLine: z.literal('esports'),
    /** Short name shown in the results. */
    label: z.string().min(1),
  })
  .refine(({ question }) => question.includes('{line}'), {
    message: 'The question text needs a {line} placeholder',
  });

/** A logo round offers the logo's team and three others. */
const OPTIONS_PER_LOGO_ROUND = 4;

/**
 * "Which team does this logo belong to?": the round shows a random team's logo and offers that
 * team and three others as plain names. `teams` is written out by hand: only well-known teams
 * whose logos are distinct (no two logos of one organisation) and visible on a dark background.
 */
const LogoQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    subject: z.literal('text'),
    logo: z.literal('team'),
    /** Short name shown in the results. */
    label: z.string().min(1),
    /** Team names exactly as in `data/esportsImages.json`. */
    teams: z.array(z.string().min(1)).min(OPTIONS_PER_LOGO_ROUND),
  })
  .refine(({ teams }) => new Set(teams).size === teams.length, {
    message: 'A team may be listed only once',
  });

/** Player questions about a title; they need to say which tournament (`event`). */
const TITLE_ASKS: readonly string[] = ['playerWithTitle', 'playerWithoutTitle'];

/**
 * A question made from `data/players.json`. It names a random team and asks for a player who
 * played there (`playerByTeam`, `{team}`), names a player and asks for one of their teams
 * (`teamByPlayer`, `{player}`), quotes a nickname (`playerByNickname`, `{nickname}`), names a
 * region (`playerByRegion`, `{region}`) or a role (`playerByRole`, `{role}`), or asks who has
 * (`playerWithTitle`) or has never (`playerWithoutTitle`) won the `event`. Options are plain text.
 */
const PlayerQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    subject: z.literal('text'),
    ask: z.enum([
      'playerByTeam',
      'teamByPlayer',
      'playerByNickname',
      'playerByRegion',
      'playerByRole',
      'playerWithTitle',
      'playerWithoutTitle',
    ]),
    /** The tournament a title question is about; only for those. */
    event: PlayerTitleEventSchema.optional(),
    /** Short name shown in the results. */
    label: z.string().min(1),
  })
  .refine(({ ask, event }) => TITLE_ASKS.includes(ask) === (event !== undefined), {
    message: 'event is required for title questions and allowed only there',
  });

/** One answer per year is only meaningful when each year appears once. */
const hasUniqueYears = ({ byYear }: { byYear: { year: number }[] }) =>
  new Set(byYear.map(({ year }) => year)).size === byYear.length;

/** Rounds need the year's answer plus three answers of other years as wrong options. */
const MIN_DISTINCT_ANSWERS = 4;

/**
 * A question with one answer per year ("Which team won Worlds in {year}?", "Who was Finals MVP
 * in {year}?"). The answers are written out here, one per year; the wrong options are the
 * answers of other years, so none of them can be argued to be right.
 */
const YearQuestionTemplateSchema = z
  .strictObject({
    ...QuestionFields,
    subject: z.literal('text'),
    /** Short name shown in the results. */
    label: z.string().min(1),
    /** The answer of each year; it is also the option shown. */
    byYear: z.array(
      z.strictObject({ year: z.number().int().min(2011), answer: z.string().min(1) }),
    ),
  })
  .refine(hasUniqueYears, { message: 'A year may appear only once in byYear' })
  .refine(
    ({ byYear }) => new Set(byYear.map(({ answer }) => answer)).size >= MIN_DISTINCT_ANSWERS,
    { message: `byYear needs at least ${String(MIN_DISTINCT_ANSWERS)} different answers` },
  )
  .refine(({ question }) => question.includes('{year}'), {
    message: 'The question text needs a {year} placeholder',
  });

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

/** One kind of question, hand-written in `data/questions/<category>.json`. */
export const QuestionTemplateSchema = z.union([
  StatQuestionTemplateSchema,
  PickQuestionTemplateSchema,
  ClueQuestionTemplateSchema,
  PlayerQuestionTemplateSchema,
  YearQuestionTemplateSchema,
  SkinLineQuestionTemplateSchema,
  LogoQuestionTemplateSchema,
]);
export type QuestionTemplate = z.infer<typeof QuestionTemplateSchema>;
export type StatQuestionTemplate = z.infer<typeof StatQuestionTemplateSchema>;
export type PickQuestionTemplate = z.infer<typeof PickQuestionTemplateSchema>;
export type ClueQuestionTemplate = z.infer<typeof ClueQuestionTemplateSchema>;
export type PlayerQuestionTemplate = z.infer<typeof PlayerQuestionTemplateSchema>;
export type YearQuestionTemplate = z.infer<typeof YearQuestionTemplateSchema>;
export type SkinLineQuestionTemplate = z.infer<typeof SkinLineQuestionTemplateSchema>;
export type LogoQuestionTemplate = z.infer<typeof LogoQuestionTemplateSchema>;

export const QuestionFileSchema = z
  .object({ questions: z.array(QuestionTemplateSchema).min(1) })
  .refine(({ questions }) => new Set(questions.map(({ id }) => id)).size === questions.length, {
    message: 'Question ids must be unique',
  });
export type QuestionFile = z.infer<typeof QuestionFileSchema>;

/**
 * One category's question file, `data/questions/<category>.json`. Its entries leave out
 * `category`: the file decides it, so a question cannot disagree with the file it is in. The
 * entries are checked in full once the category is added.
 */
export const CategoryQuestionFileSchema = z.object({
  questions: z
    .array(
      z.record(z.string(), z.unknown()).refine((entry) => !('category' in entry), {
        message: 'category comes from the file the question is in',
      }),
    )
    .min(1),
});
