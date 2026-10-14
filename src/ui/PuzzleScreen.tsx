import { useMemo } from 'preact/hooks';
import type { GameDataFile } from '../data/schema';
import { createDailyPuzzle } from '../game/dailyPuzzle';
import type { StorageLike } from '../storage/progressStore';
import { Game } from './Game';

interface PuzzleScreenProps {
  file: GameDataFile;
  /** The puzzle day being played (today, or an earlier day from the archive). */
  date: string;
  /** The real current UTC day. */
  today: string;
  storage: StorageLike | undefined;
  shareUrl: string;
}

/** Builds the puzzle for `date` from the loaded data and plays it. */
export function PuzzleScreen({ file, date, today, storage, shareUrl }: PuzzleScreenProps) {
  const daily = useMemo(() => {
    try {
      const { puzzle, snapshot } = createDailyPuzzle(file, date);
      return {
        puzzle,
        entities: {
          champion: new Map(snapshot.champions.map((champion) => [champion.id, champion])),
          item: new Map(snapshot.items.map((item) => [item.id, item])),
        },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [file, date]);

  if ('error' in daily) {
    return (
      <p role="alert">
        Something went wrong creating the puzzle ({daily.error}). Try reloading the page.
      </p>
    );
  }

  return (
    <Game
      key={date}
      puzzle={daily.puzzle}
      entities={daily.entities}
      date={date}
      today={today}
      storage={storage}
      shareUrl={shareUrl}
    />
  );
}
