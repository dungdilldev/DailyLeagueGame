import { useEffect, useRef } from 'preact/hooks';
import type { Round } from '../game/puzzle';
import type { Entity } from '../data/schema';
import { isCorrect } from '../game/progress';
import { displayValue } from '../game/roundDisplay';
import { clueImageUrl, roundSymbols } from '../game/textSymbols';
import { Icon } from './icons';
import { OptionCard, type CardState } from './OptionCard';
import { RoundProgress } from './RoundProgress';

interface RoundViewProps {
  round: Round;
  roundNumber: number;
  /** Number of rounds in the day; undefined in the endless mode, which has no end. */
  totalRounds: number | undefined;
  /** The champions, items or abilities of this round's subject, by id. */
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
  ability: 'Abilities',
  text: undefined,
};

function cardState(round: Round, optionId: string, chosenId: string | undefined): CardState {
  if (chosenId === undefined) return 'idle';
  if (optionId === round.answerId) return 'correct';
  return optionId === chosenId ? 'wrong' : 'other';
}

const WRONG_PICK_TAG = 'Your pick';
const STAT_HINT = 'Pick the one with the highest value.';
const PICK_HINT = 'Pick one of the four options.';

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
  const clueUrl = clueImageUrl(round);
  const answerName = options.get(round.answerId)?.name ?? round.answerId;
  const answeredRight = chosenId !== undefined && isCorrect(round, chosenId);

  return (
    <section class="round" aria-labelledby="question">
      <div class="round__meta">
        <div class="round__label">
          <p class="progress">
            {totalRounds === undefined
              ? `Question ${String(roundNumber)}`
              : `Round ${String(roundNumber)} of ${String(totalRounds)}`}
          </p>
          {SUBJECT_LABELS[round.subject] && (
            <span class="chip">{SUBJECT_LABELS[round.subject]}</span>
          )}
        </div>
        {totalRounds !== undefined && results && (
          <RoundProgress current={roundNumber - 1} total={totalRounds} results={results} />
        )}
      </div>
      {clueUrl && (
        <img
          class="round__clue"
          src={clueUrl}
          alt="The logo to recognise"
          width={120}
          height={120}
        />
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
        {revealed ? (
          <>
            {/* A tinted panel in the cards' colours, so the answer text is read, not skimmed. */}
            <div class={`feedback__panel ${answeredRight ? 'feedback__ok' : 'feedback__bad'}`}>
              <span class="feedback__mark">
                <Icon name={answeredRight ? 'check' : 'cross'} size={18} />
              </span>
              <div class="feedback__text">
                <p class="feedback__banner">
                  {answeredRight ? 'Correct!' : `Not quite. It was ${answerName}.`}
                </p>
                {round.explanation && <p class="feedback__explanation">{round.explanation}</p>}
              </div>
            </div>
            <button type="button" class="button" ref={nextButton} onClick={onNext}>
              {isLastRound ? 'See results' : 'Next round'}
              <Icon name="arrowRight" size={16} />
            </button>
          </>
        ) : (
          <p class="feedback__hint">{round.format ? STAT_HINT : PICK_HINT}</p>
        )}
      </div>
    </section>
  );
}
