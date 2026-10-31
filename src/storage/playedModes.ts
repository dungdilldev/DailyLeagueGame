import { GAME_MODES, progressSlot, type GameMode } from '../game/gameMode';
import { loadSavedDays, type StorageLike } from './progressStore';

/** The modes whose puzzle of `date` has been finished, so the start page can mark them. */
export function modesFinishedOn(storage: StorageLike | undefined, date: string): GameMode[] {
  return GAME_MODES.filter(
    (mode) => loadSavedDays(storage, progressSlot(mode))[date]?.complete === true,
  );
}
