import { useState } from 'preact/hooks';
import type { Puzzle } from '../game/puzzle';
import type { Entity, StatSubject } from '../data/schema';
import { isComplete, submitAnswer, validAnswers } from '../game/progress';
import { progressSlot, type GameMode } from '../game/gameMode';
import { currentStreak } from '../game/streak';
import { completedDates, loadSavedDays, saveDay, type StorageLike } from '../storage/progressStore';
import { ResultsView } from './ResultsView';
import { RoundView } from './RoundView';

interface GameProps {
  puzzle: Puzzle;
  /** Champions and items by id, for showing names and icons. */
  entities: Readonly<Record<StatSubject, ReadonlyMap<string, Entity>>>;
  /** Which game mode this puzzle belongs to; each mode saves its own progress and streak. */
  mode: GameMode;
  /** UTC date of the puzzle being played. */
  date: string;
  /** The real current UTC day. Playing an earlier day does not count for the streak. */
  today: string;
  storage: StorageLike | undefined;
  shareUrl: string;
}

export function Game({ puzzle, entities, mode, date, today, storage, shareUrl }: GameProps) {
  const slot = progressSlot(mode);
  const [days, setDays] = useState(() => loadSavedDays(storage, slot));
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
        mode={mode}
        shareUrl={shareUrl}
      />
    );
  }

  const roundIndex = revealing ? answers.length - 1 : answers.length;
  const round = puzzle.rounds[roundIndex];
  if (!round) return null;

  const choose = (optionId: string) => {
    const next = submitAnswer(puzzle, answers, optionId);
    const record = {
      answers: next,
      complete: isComplete(puzzle, next),
      ...(date !== today && { late: true }),
    };
    saveDay(storage, date, record, slot);
    setDays((previous) => ({ ...previous, [date]: record }));
    setRevealing(true);
  };

  return (
    <RoundView
      key={roundIndex}
      round={round}
      roundNumber={roundIndex + 1}
      totalRounds={puzzle.rounds.length}
      options={entities[round.subject]}
      chosenId={revealing ? answers[roundIndex] : undefined}
      onChoose={choose}
      onNext={() => {
        setRevealing(false);
      }}
    />
  );
}
