import { useState } from 'preact/hooks';
import { resolvePuzzleDate } from '../game/archive';
import { formatUtcDate } from '../game/date';
import type { GameMode } from '../game/gameMode';
import { getBrowserStorage } from '../storage/progressStore';
import { modesFinishedOn } from '../storage/playedModes';
import { AdSlot } from './AdSlot';
import { DayNav } from './DayNav';
import { EndlessScreen } from './EndlessScreen';
import { ModeNav } from './ModeNav';
import { PrivacySettingsLink } from './PrivacySettingsLink';
import { PuzzleScreen } from './PuzzleScreen';
import { SupportButton } from './SupportButton';
import { DATE_PARAM } from './modePages';
import { cleanSeed, randomSeed } from './randomSeed';
import { useGameFile } from './useGameFile';

// Evaluated once per page load: "today" stays fixed until the player reloads after midnight UTC.
const TODAY = formatUtcDate(new Date());
const SHARE_URL = window.location.origin + window.location.pathname;
const MODE_PARAM = 'mode';
const SEED_PARAM = 'seed';
const ENDLESS_MODE = 'endless';

// A testing tool, so it only exists in development builds: Vite replaces `import.meta.env.DEV`
// with `false` in production and drops the endless screen from the bundle.
const isEndlessMode =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get(MODE_PARAM) === ENDLESS_MODE;

function readRequestedDate(): string {
  const requested = new URLSearchParams(window.location.search).get(DATE_PARAM);
  return resolvePuzzleDate(requested, TODAY);
}

function readInitialSeed(): string {
  return cleanSeed(new URLSearchParams(window.location.search).get(SEED_PARAM)) ?? randomSeed();
}

/** Keeps the address bar in sync so an earlier day survives a reload and can be bookmarked. */
function showDateInUrl(date: string): void {
  const url = new URL(window.location.href);
  if (date === TODAY) url.searchParams.delete(DATE_PARAM);
  else url.searchParams.set(DATE_PARAM, date);
  window.history.replaceState(null, '', url);
}

/** Puts the endless mode's seed in the address, so reloading or sharing the link repeats it. */
function showSeedInUrl(seed: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(SEED_PARAM, seed);
  window.history.replaceState(null, '', url);
}

interface BodyProps {
  date: string;
  mode: GameMode;
}

function Body({ date, mode }: BodyProps) {
  const state = useGameFile();

  switch (state.kind) {
    case 'loading':
      return <p role="status">Loading the puzzle&hellip;</p>;
    case 'error':
      return (
        <p role="alert">
          Something went wrong loading the puzzle ({state.message}). Try reloading the page.
        </p>
      );
    case 'ready':
      return isEndlessMode ? (
        <EndlessScreen
          data={state.data}
          initialSeed={readInitialSeed()}
          onSeedChange={showSeedInUrl}
        />
      ) : (
        <PuzzleScreen
          data={state.data}
          mode={mode}
          date={date}
          today={TODAY}
          storage={getBrowserStorage()}
          shareUrl={SHARE_URL}
        />
      );
  }
}

interface AppProps {
  /** The mode of this page: each mode has its own page. */
  mode: GameMode;
}

export function App({ mode }: AppProps) {
  const [date, setDate] = useState(readRequestedDate);

  const changeDate = (next: string) => {
    setDate(next);
    showDateInUrl(next);
  };

  return (
    <>
      {isEndlessMode ? (
        <p class="mode-link">
          <a href={window.location.pathname}>&larr; Back to the daily puzzle</a>
        </p>
      ) : (
        <>
          <div class="game__toolbar">
            <ModeNav
              mode={mode}
              finished={modesFinishedOn(getBrowserStorage(), date)}
              archiveDate={date === TODAY ? undefined : date}
            />
            <DayNav date={date} today={TODAY} onChange={changeDate} />
          </div>
        </>
      )}
      <Body date={date} mode={mode} />
      <SupportButton />
      {!isEndlessMode && (
        <>
          <AdSlot />
          <PrivacySettingsLink />
        </>
      )}
    </>
  );
}
