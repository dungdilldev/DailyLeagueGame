import { useEffect, useState } from 'preact/hooks';
import { COLORBLIND_CHANGE_EVENT, isColorblindModeOn } from './colorblindMode';

/** Whether colorblind mode is on, updated when the player switches it in the settings menu. */
export function useColorblindMode(): boolean {
  const [enabled, setEnabled] = useState(isColorblindModeOn);
  useEffect(() => {
    const update = () => {
      setEnabled(isColorblindModeOn());
    };
    document.addEventListener(COLORBLIND_CHANGE_EVENT, update);
    return () => {
      document.removeEventListener(COLORBLIND_CHANGE_EVENT, update);
    };
  }, []);
  return enabled;
}
