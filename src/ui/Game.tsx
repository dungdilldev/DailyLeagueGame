import { useState } from 'preact/hooks';
import type { Puzzle } from '../data/puzzleSchema';
import type { Champion } from '../data/schema';
import { isComplete, submitAnswer } from '../game/progress';
import { currentStreak } from '../game/streak';
import { completedDates, loadSavedDays, saveDay, type StorageLike } from '../storage/progressStore';
import { ResultsView } from './ResultsView';
import { RoundView } from './RoundView';

interface GameProps {
  puzzle: Puzzle;
  champions: ReadonlyMap<string, Champion>;
  /** UTC date of the puzzle being played. */
  today: string;
  storage: StorageLike | undefined;
  shareUrl: string;
}

export function Game({ puzzle, champions, today, storage, shareUrl }: GameProps) {
  const [days, setDays] = useState(() => loadSavedDays(storage));
  // True between answering a round and pressing "Next": the reveal is shown for that round.
  const [revealing, setRevealing] = useState(false);

  const answers = days[today]?.answers ?? [];
  const complete = isComplete(puzzle, answers);

  if (complete && !revealing) {
    return (
      <ResultsView
        puzzle={puzzle}
        answers={answers}
        streak={currentStreak(completedDates(days), today)}
        shareUrl={shareUrl}
      />
    );
  }

  const roundIndex = revealing ? answers.length - 1 : answers.length;
  const round = puzzle.rounds[roundIndex];
  if (!round) return null;

  const choose = (championId: string) => {
    const next = submitAnswer(puzzle, answers, championId);
    const record = { answers: next, complete: isComplete(puzzle, next) };
    saveDay(storage, today, record);
    setDays((previous) => ({ ...previous, [today]: record }));
    setRevealing(true);
  };

  return (
    <RoundView
      key={roundIndex}
      round={round}
      roundNumber={roundIndex + 1}
      totalRounds={puzzle.rounds.length}
      champions={champions}
      chosenId={revealing ? answers[roundIndex] : undefined}
      onChoose={choose}
      onNext={() => {
        setRevealing(false);
      }}
    />
  );
}
