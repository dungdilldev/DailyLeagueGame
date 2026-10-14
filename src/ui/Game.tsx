import { useState } from 'preact/hooks';
import type { Puzzle } from '../game/puzzle';
import type { Champion } from '../data/schema';
import { isComplete, submitAnswer, validAnswers } from '../game/progress';
import { currentStreak } from '../game/streak';
import { completedDates, loadSavedDays, saveDay, type StorageLike } from '../storage/progressStore';
import { ResultsView } from './ResultsView';
import { RoundView } from './RoundView';

interface GameProps {
  puzzle: Puzzle;
  champions: ReadonlyMap<string, Champion>;
  /** UTC date of the puzzle being played. */
  date: string;
  /** The real current UTC day. Playing an earlier day does not count for the streak. */
  today: string;
  storage: StorageLike | undefined;
  shareUrl: string;
}

export function Game({ puzzle, champions, date, today, storage, shareUrl }: GameProps) {
  const [days, setDays] = useState(() => loadSavedDays(storage));
  // True between answering a round and pressing "Next": the reveal is shown for that round.
  const [revealing, setRevealing] = useState(false);

  // Saved answers that do not fit this puzzle (e.g. it was generated differently) are dropped.
  const answers = validAnswers(puzzle, days[date]?.answers ?? []);
  const complete = isComplete(puzzle, answers);

  if (complete && !revealing) {
    return (
      <ResultsView
        puzzle={puzzle}
        answers={answers}
        streak={currentStreak(
          completedDates(days).filter((completed) => completed !== date || complete),
          today,
        )}
        isToday={date === today}
        shareUrl={shareUrl}
      />
    );
  }

  const roundIndex = revealing ? answers.length - 1 : answers.length;
  const round = puzzle.rounds[roundIndex];
  if (!round) return null;

  const choose = (championId: string) => {
    const next = submitAnswer(puzzle, answers, championId);
    const record = {
      answers: next,
      complete: isComplete(puzzle, next),
      ...(date !== today && { late: true }),
    };
    saveDay(storage, date, record);
    setDays((previous) => ({ ...previous, [date]: record }));
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
