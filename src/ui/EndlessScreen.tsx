import { useEffect, useMemo, useState } from 'preact/hooks';
import { questionLabel, type GameData } from '../data/questions';
import { QuestionCategorySchema, type QuestionCategory } from '../data/schema';
import { newestPuzzleData } from '../game/dailyPuzzle';
import { buildEntityLookup } from '../game/entityLookup';
import { buildEndlessQuestion } from '../game/endless';
import { emptyCoverage, recordAnswer, recordShown } from '../game/endlessCoverage';
import { ROUND_GAP_BANDS } from '../game/generate/config';
import { newestSnapshot } from '../game/snapshot';
import type { GapBand } from '../game/generate/config';
import { CATEGORY_LABELS, groupQuestions, subcategoryLabel } from './categoryLabels';
import { CoveragePanel } from './CoveragePanel';
import { randomSeed } from './randomSeed';
import { RoundView } from './RoundView';

const ANY = 'any';
const PERCENT = 100;

interface EndlessScreenProps {
  data: GameData;
  initialSeed: string;
  /** Called when the seed changes, so the address bar can follow. */
  onSeedChange: (seed: string) => void;
}

function describeBand(band: GapBand): string {
  const min = Math.round(band.minRatio * PERCENT);
  const max = Math.round(band.maxRatio * PERCENT);
  return max >= PERCENT ? `${String(min)}% or more` : `${String(min)}-${String(max)}%`;
}

/**
 * Endlessly generates random questions for testing: nothing is saved and nothing counts towards
 * the streak. The same seed always gives the same sequence, so a problem can be reproduced.
 */
export function EndlessScreen({ data, initialSeed, onSeedChange }: EndlessScreenProps) {
  const [seed, setSeed] = useState(initialSeed);
  const [index, setIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState(ANY);
  const [subcategoryFilter, setSubcategoryFilter] = useState(ANY);
  const [questionFilter, setQuestionFilter] = useState(ANY);
  const [bandFilter, setBandFilter] = useState(ANY);
  const [chosenId, setChosenId] = useState<string | undefined>();
  const [coverage, setCoverage] = useState(emptyCoverage);

  // The newest data, even if it only takes effect tomorrow, so everything can be tested early.
  const puzzleData = useMemo(() => newestPuzzleData(data), [data]);
  const entities = useMemo(() => buildEntityLookup(puzzleData), [puzzleData]);

  const question = useMemo(
    () =>
      buildEndlessQuestion(puzzleData, data.questions, seed, index, {
        ...(categoryFilter !== ANY && { category: categoryFilter as QuestionCategory }),
        ...(subcategoryFilter !== ANY && { subcategory: subcategoryFilter }),
        ...(questionFilter !== ANY && { questionId: questionFilter }),
        ...(bandFilter !== ANY && { bandIndex: Number(bandFilter) }),
      }),
    [
      puzzleData,
      data.questions,
      seed,
      index,
      categoryFilter,
      subcategoryFilter,
      questionFilter,
      bandFilter,
    ],
  );

  // Count each question once when it appears (a changed filter shows a new question).
  const shownKey = `${seed}#${String(index)}#${categoryFilter}#${subcategoryFilter}#${questionFilter}#${bandFilter}`;
  useEffect(() => {
    if (question) setCoverage((previous) => recordShown(previous, question));
  }, [shownKey]);

  const showNext = () => {
    setIndex((previous) => previous + 1);
    setChosenId(undefined);
  };
  const startNewSeed = () => {
    const next = randomSeed();
    setSeed(next);
    setIndex(0);
    setChosenId(undefined);
    setCoverage(emptyCoverage());
    onSeedChange(next);
  };
  const choose = (optionId: string) => {
    if (!question) return;
    setChosenId(optionId);
    setCoverage((previous) =>
      recordAnswer(previous, question.round.questionId, optionId === question.round.answerId),
    );
  };

  const band = question && ROUND_GAP_BANDS[question.bandIndex];
  const inCategory = groupQuestions(data.questions).filter(
    ({ category }) => categoryFilter === ANY || category === categoryFilter,
  );
  const subcategories = [
    ...new Set(inCategory.flatMap(({ subcategory }) => (subcategory ? [subcategory] : []))),
  ];
  const questionGroups = inCategory.filter(
    ({ subcategory }) => subcategoryFilter === ANY || subcategory === subcategoryFilter,
  );

  return (
    <section aria-labelledby="endless-heading">
      <h2 id="endless-heading">Endless mode</h2>
      <p class="endless__note">
        Random questions for testing. Nothing is saved and nothing counts towards your streak. Data
        from champion patch {newestSnapshot(data.champions.snapshots).patch} and item patch{' '}
        {newestSnapshot(data.items.snapshots).patch}.
      </p>

      <div class="endless__controls">
        <label>
          Category{' '}
          <select
            value={categoryFilter}
            onChange={(event) => {
              // The chosen question may belong to another category.
              setCategoryFilter(event.currentTarget.value);
              setSubcategoryFilter(ANY);
              setQuestionFilter(ANY);
              setChosenId(undefined);
            }}
          >
            <option value={ANY}>Any (random)</option>
            {QuestionCategorySchema.options.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        {subcategories.length > 0 && (
          <label>
            Subcategory{' '}
            <select
              value={subcategoryFilter}
              onChange={(event) => {
                setSubcategoryFilter(event.currentTarget.value);
                setQuestionFilter(ANY);
                setChosenId(undefined);
              }}
            >
              <option value={ANY}>Any (random)</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategoryLabel(subcategory)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Question{' '}
          <select
            value={questionFilter}
            onChange={(event) => {
              setQuestionFilter(event.currentTarget.value);
              setChosenId(undefined);
            }}
          >
            <option value={ANY}>Any (random)</option>
            {questionGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {questionLabel(question)} ({question.subject})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Difficulty{' '}
          <select
            value={bandFilter}
            onChange={(event) => {
              setBandFilter(event.currentTarget.value);
              setChosenId(undefined);
            }}
          >
            <option value={ANY}>Any (random)</option>
            {ROUND_GAP_BANDS.map((roundBand, bandIndex) => (
              <option key={bandIndex} value={String(bandIndex)}>
                {bandIndex + 1} (gap {describeBand(roundBand)})
              </option>
            ))}
          </select>
        </label>
        <button type="button" class="button button--small" onClick={showNext}>
          Skip question
        </button>
        <button type="button" class="button button--small" onClick={startNewSeed}>
          New seed
        </button>
      </div>

      <p class="endless__debug">
        Seed <code>{seed}</code> &middot; question #{index + 1}
        {question && band && (
          <>
            {' '}
            &middot; <code>{question.round.questionId}</code> &middot; difficulty{' '}
            {question.bandIndex + 1} (gap {describeBand(band)})
          </>
        )}
      </p>

      {question ? (
        <RoundView
          key={shownKey}
          round={question.round}
          roundNumber={index + 1}
          totalRounds={undefined}
          options={entities[question.round.subject]}
          chosenId={chosenId}
          onChoose={choose}
          onNext={showNext}
        />
      ) : (
        <p role="status">
          This question cannot be built at this difficulty: its values are too few or too close
          together. Pick another difficulty or question.
        </p>
      )}

      <CoveragePanel questions={data.questions} coverage={coverage} />
    </section>
  );
}
