import { useEffect, useRef } from 'preact/hooks';
import type { Round } from '../game/puzzle';
import type { Entity } from '../data/schema';
import { isCorrect } from '../game/progress';
import { displayValue } from '../game/roundDisplay';
import { OptionCard, type CardState } from './OptionCard';

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
}

function cardState(round: Round, optionId: string, chosenId: string | undefined): CardState {
  if (chosenId === undefined) return 'idle';
  if (optionId === round.answerId) return 'correct';
  return optionId === chosenId ? 'wrong' : 'other';
}

export function RoundView({
  round,
  roundNumber,
  totalRounds,
  options,
  chosenId,
  onChoose,
  onNext,
}: RoundViewProps) {
  const nextButton = useRef<HTMLButtonElement>(null);
  const revealed = chosenId !== undefined;

  // Keyboard and screen-reader users land on the next action after answering.
  useEffect(() => {
    if (revealed) nextButton.current?.focus();
  }, [revealed]);

  const isLastRound = totalRounds !== undefined && roundNumber === totalRounds;
  const answerName = options.get(round.answerId)?.name ?? round.answerId;

  return (
    <section aria-labelledby="question">
      <p class="progress">
        {totalRounds === undefined
          ? `Question ${String(roundNumber)}`
          : `Round ${String(roundNumber)} of ${String(totalRounds)}`}
      </p>
      <h2 id="question" class="question">
        {round.question}
      </h2>

      <div class="cards">
        {round.optionIds.map((id) => {
          const option = options.get(id);
          return (
            <OptionCard
              key={id}
              name={option?.name ?? id}
              iconUrl={option?.iconUrl}
              valueText={revealed ? displayValue(round, id) : undefined}
              state={cardState(round, id, chosenId)}
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
            <p class={isCorrect(round, chosenId) ? 'feedback__ok' : 'feedback__bad'}>
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
