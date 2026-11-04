import { useMemo } from 'preact/hooks';
import type { GameData } from '../data/questions';
import { createDailyPuzzle } from '../game/dailyPuzzle';
import type { GameMode } from '../game/gameMode';
import type { StorageLike } from '../storage/progressStore';
import { Game } from './Game';

interface PuzzleScreenProps {
  data: GameData;
  mode: GameMode;
  /** The puzzle day being played (today, or an earlier day from the archive). */
  date: string;
  /** The real current UTC day. */
  today: string;
  storage: StorageLike | undefined;
  shareUrl: string;
}

/** Builds the puzzle for `date` from the loaded data and plays it. */
export function PuzzleScreen({ data, mode, date, today, storage, shareUrl }: PuzzleScreenProps) {
  const daily = useMemo(() => {
    try {
      return createDailyPuzzle(data, date, mode);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [data, mode, date]);

  if ('error' in daily) {
    return (
      <p role="alert">
        Something went wrong creating the puzzle ({daily.error}). Try reloading the page.
      </p>
    );
  }

  return (
    <Game
      key={`${mode}:${date}`}
      mode={mode}
      puzzle={daily.puzzle}
      entities={daily.entities}
      date={date}
      today={today}
      storage={storage}
      shareUrl={shareUrl}
    />
  );
}
