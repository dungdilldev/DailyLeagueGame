import { useEffect, useState } from 'preact/hooks';
import { loadGameData } from '../data/loaders';
import type { GameData } from '../data/questions';

export type GameFileState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: GameData };

/** Loads the game data once; switching puzzle days reuses it. */
export function useGameFile(): GameFileState {
  const [state, setState] = useState<GameFileState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadGameData()
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
