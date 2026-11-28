import type { StorageLike } from './progressStore';

// Not under `dailyleague:v1:`, where each game mode keeps its progress (`progressStorageKey`).
const SETTINGS_KEY = 'dailyleague:settings';

/** The player's choices from the settings menu in the header, shared by every page. */
export interface Settings {
  colorblind: boolean;
}

export const DEFAULT_SETTINGS: Settings = { colorblind: false };

/** The saved settings; a missing or malformed value falls back to its default. Never throws. */
export function loadSettings(storage: StorageLike | undefined): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
    const { colorblind } = value as Record<string, unknown>;
    return {
      colorblind: typeof colorblind === 'boolean' ? colorblind : DEFAULT_SETTINGS.colorblind,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saves the settings. Failures are ignored: the choice then lasts until the page is left. */
export function saveSettings(storage: StorageLike | undefined, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked.
  }
}
