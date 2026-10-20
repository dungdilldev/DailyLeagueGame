import { useEffect, useRef } from 'preact/hooks';
import type { Round } from '../game/puzzle';
import type { Entity } from '../data/schema';
import { isCorrect } from '../game/progress';
import { displayValue } from '../game/roundDisplay';
import { roundSymbols } from '../game/textSymbols';
import { OptionCard, type CardState } from './OptionCard';
import { RoundProgress } from './RoundProgress';

interface RoundViewProps {
  round: Round;
  roundNumber: number;
  /** Number of rounds in the day; undefined in the endless mode, which has no end. */
  totalRounds: number | undefined;
  /** The champions or items of this round's subject, by id. */
  options: ReadonlyMap<string, Entity>;
  /** Set once the player has answered; switches the view to the reveal. */
  chosenId: string | undefined;
  onChoose: (optionId: string) => void;
  onNext: () => void;
  /** Results of the rounds answered so far, for the progress tiles; omitted in endless mode. */
  results?: readonly boolean[];
}

/** Text options (teams, cities) are self-explanatory from the question, so they get no label. */
const SUBJECT_LABELS: Record<Round['subject'], string | undefined> = {
  champion: 'Champions',
  item: 'Items',
  text: undefined,
};

function cardState(round: Round, optionId: string, chosenId: string | undefined): CardState {
  if (chosenId === undefined) return 'idle';
  if (optionId === round.answerId) return 'correct';
  return optionId === chosenId ? 'wrong' : 'other';
}

const WRONG_PICK_TAG = 'Your pick';

/** A stat question's answer is the highest value; a pick question's answer has no value. */
function cardTag(round: Round, state: CardState): string | undefined {
  if (state === 'wrong') return WRONG_PICK_TAG;
  if (state === 'correct') return round.format ? 'Highest' : 'Correct';
  return undefined;
}

export function RoundView({
  round,
  roundNumber,
  totalRounds,
  options,
  chosenId,
  onChoose,
  onNext,
  results,
}: RoundViewProps) {
  const nextButton = useRef<HTMLButtonElement>(null);
  const revealed = chosenId !== undefined;

  // Keyboard and screen-reader users land on the next action after answering.
  useEffect(() => {
    if (revealed) nextButton.current?.focus({ preventScroll: true });
  }, [revealed]);

  const isLastRound = totalRounds !== undefined && roundNumber === totalRounds;
  const symbols = roundSymbols(round);
  const answerName = options.get(round.answerId)?.name ?? round.answerId;

  return (
    <section class="round" aria-labelledby="question">
      <div class="round__meta">
        <p class="progress">
          {totalRounds === undefined
            ? `Question ${String(roundNumber)}`
            : `Round ${String(roundNumber)} of ${String(totalRounds)}`}
        </p>
        {SUBJECT_LABELS[round.subject] && <span class="chip">{SUBJECT_LABELS[round.subject]}</span>}
      </div>
      {totalRounds !== undefined && results && (
        <RoundProgress current={roundNumber - 1} total={totalRounds} results={results} />
      )}
      <h2 id="question" class="question">
        {round.question}
      </h2>

      <div class="cards">
        {round.optionIds.map((id) => {
          const option = options.get(id);
          const state = cardState(round, id, chosenId);
          return (
            <OptionCard
              key={id}
              name={option?.name ?? id}
              iconUrl={symbols?.urls[id] ?? option?.iconUrl}
              isSymbol={symbols?.kind === 'crest'}
              valueText={displayValue(round, id)}
              valueRevealed={revealed}
              state={state}
              tag={cardTag(round, state)}
              disabled={revealed}
              onSelect={() => {
                onChoose(id);
              }}
            />
          );
        })}
      </div>

      <div class="feedback" role="status">
        {revealed && (
          <>
            <p
              class={`feedback__banner ${isCorrect(round, chosenId) ? 'feedback__ok' : 'feedback__bad'}`}
            >
              {isCorrect(round, chosenId) ? 'Correct!' : `Not quite. It was ${answerName}.`}
            </p>
            <button type="button" class="button" ref={nextButton} onClick={onNext}>
              {isLastRound ? 'See results' : 'Next round'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
