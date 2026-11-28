import { getBrowserStorage } from '../storage/progressStore';
import { loadSettings, saveSettings } from '../storage/settings';

/** Set on `<html>` while colorblind mode is on; `styles.css` then swaps green and red for blue and orange. */
const COLORBLIND_ATTRIBUTE = 'data-colorblind';
/** Fired on `document` when the mode is switched, so parts drawn by script (the share text) follow. */
export const COLORBLIND_CHANGE_EVENT = 'colorblindchange';

export function isColorblindModeOn(): boolean {
  return document.documentElement.hasAttribute(COLORBLIND_ATTRIBUTE);
}

/** Applies the saved choice. Called by every page's script before it draws anything coloured. */
export function applySavedColorblindMode(): void {
  const { colorblind } = loadSettings(getBrowserStorage());
  document.documentElement.toggleAttribute(COLORBLIND_ATTRIBUTE, colorblind);
}

export function setColorblindMode(enabled: boolean): void {
  const storage = getBrowserStorage();
  saveSettings(storage, { ...loadSettings(storage), colorblind: enabled });
  document.documentElement.toggleAttribute(COLORBLIND_ATTRIBUTE, enabled);
  document.dispatchEvent(new Event(COLORBLIND_CHANGE_EVENT));
}
