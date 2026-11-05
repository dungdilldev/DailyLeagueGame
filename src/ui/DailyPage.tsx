import { useMemo } from 'preact/hooks';
import { formatDayLabel } from '../game/date';
import type { GameMode } from '../game/gameMode';
import { optionLookup, type PuzzleDay } from '../game/puzzleDays';
import type { StorageLike } from '../storage/progressStore';
import { modesFinishedOn } from '../storage/playedModes';
import { Game } from './Game';
import { ModeNav } from './ModeNav';

interface DailyPageProps {
  mode: GameMode;
  day: PuzzleDay;
  /** False when the page has no puzzle for today and shows the newest one it has instead. */
  isToday: boolean;
  storage: StorageLike | undefined;
  shareUrl: string;
}

/**
 * The game of one day with the mode links above it. The build renders it into the page (with no
 * storage, so as a first visit), and the browser renders it again with the player's progress.
 */
export function DailyPage({ mode, day, isToday, storage, shareUrl }: DailyPageProps) {
  const { puzzle } = day;
  const options = useMemo(() => optionLookup(day), [day]);

  return (
    <>
      <div class="game__toolbar">
        <ModeNav mode={mode} finished={modesFinishedOn(storage, puzzle.date)} />
      </div>
      {!isToday && (
        <p class="game__note" role="status">
          {`Today's puzzle is not out yet, so this is the puzzle of ${formatDayLabel(puzzle.date)}. Try reloading in a little while.`}
        </p>
      )}
      <Game
        key={`${mode}:${puzzle.date}`}
        mode={mode}
        puzzle={puzzle}
        entities={options}
        date={puzzle.date}
        storage={storage}
        shareUrl={shareUrl}
      />
    </>
  );
}
