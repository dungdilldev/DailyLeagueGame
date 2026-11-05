import { useEffect } from 'preact/hooks';
import { formatUtcDate } from '../game/date';
import type { GameMode } from '../game/gameMode';
import { pickPuzzleDay, type PuzzleDay } from '../game/puzzleDays';
import { getBrowserStorage } from '../storage/progressStore';
import { AdSlot } from './AdSlot';
import { DailyPage } from './DailyPage';
import { PrivacySettingsLink } from './PrivacySettingsLink';
import { SupportButton } from './SupportButton';

// Evaluated once per page load: "today" stays fixed until the player reloads after midnight UTC.
const TODAY = formatUtcDate(new Date());
const SHARE_URL = window.location.origin + window.location.pathname;
/** Earlier days could be opened with `?date=` until 2026-11-05; such links now open today. */
const OLD_DATE_PARAM = 'date';

function removeOldDateFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(OLD_DATE_PARAM)) return;
  url.searchParams.delete(OLD_DATE_PARAM);
  window.history.replaceState(null, '', url);
}

interface AppProps {
  /** The mode of this page: each mode has its own page. */
  mode: GameMode;
  /** The puzzles built into the page: today's and tomorrow's. */
  days: readonly PuzzleDay[];
}

export function App({ mode, days }: AppProps) {
  useEffect(removeOldDateFromUrl, []);
  const picked = pickPuzzleDay(days, TODAY);

  return (
    <>
      {picked ? (
        <DailyPage
          mode={mode}
          day={picked.day}
          isToday={picked.isToday}
          storage={getBrowserStorage()}
          shareUrl={SHARE_URL}
        />
      ) : (
        <p role="alert">
          Something went wrong loading the puzzle: this page has none. Try reloading the page.
        </p>
      )}
      <SupportButton />
      <AdSlot />
      <PrivacySettingsLink />
    </>
  );
}
