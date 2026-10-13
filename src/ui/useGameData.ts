import { useEffect, useState } from 'preact/hooks';
import { loadChampions, loadPuzzle, PuzzleNotFoundError } from '../data/loaders';
import type { Puzzle } from '../data/puzzleSchema';
import type { Champion } from '../data/schema';

export type GameData =
  | { kind: 'loading' }
  | { kind: 'missing'; date: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; puzzle: Puzzle; champions: ReadonlyMap<string, Champion> };

/** Loads the puzzle for `date` plus the champion roster needed to display it. */
export function useGameData(date: string): GameData {
  const [data, setData] = useState<GameData>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPuzzle(date), loadChampions()])
      .then(([puzzle, championsFile]) => {
        if (cancelled) return;
        const champions = new Map(championsFile.champions.map((c) => [c.id, c]));
        setData({ kind: 'ready', puzzle, champions });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof PuzzleNotFoundError) {
          setData({ kind: 'missing', date });
        } else {
          setData({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  return data;
}
