import { useEffect, useRef } from 'preact/hooks';
import type { Round } from '../game/puzzle';
import type { Champion } from '../data/schema';
import { isCorrect } from '../game/progress';
import { displayValue } from '../game/roundDisplay';
import { ChampionCard, type CardState } from './ChampionCard';

interface RoundViewProps {
  round: Round;
  roundNumber: number;
  totalRounds: number;
  champions: ReadonlyMap<string, Champion>;
  /** Set once the player has answered; switches the view to the reveal. */
  chosenId: string | undefined;
  onChoose: (championId: string) => void;
  onNext: () => void;
}

function cardState(round: Round, championId: string, chosenId: string | undefined): CardState {
  if (chosenId === undefined) return 'idle';
  if (championId === round.answerId) return 'correct';
  return championId === chosenId ? 'wrong' : 'other';
}

export function RoundView({
  round,
  roundNumber,
  totalRounds,
  champions,
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

  const isLastRound = roundNumber === totalRounds;
  const answerName = champions.get(round.answerId)?.name ?? round.answerId;

  return (
    <section aria-labelledby="question">
      <p class="progress">
        Round {roundNumber} of {totalRounds}
      </p>
      <h2 id="question" class="question">
        {round.question}
      </h2>

      <div class="cards">
        {round.championIds.map((id) => {
          const champion = champions.get(id);
          return (
            <ChampionCard
              key={id}
              name={champion?.name ?? id}
              iconUrl={champion?.iconUrl}
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
