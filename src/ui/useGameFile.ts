import { useEffect, useState } from 'preact/hooks';
import { loadGameData } from '../data/loaders';
import type { GameDataFile } from '../data/schema';

export type GameFileState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; file: GameDataFile };

/** Loads the game data file once; switching puzzle days reuses it. */
export function useGameFile(): GameFileState {
  const [state, setState] = useState<GameFileState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadGameData()
      .then((file) => {
        if (!cancelled) setState({ kind: 'ready', file });
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
