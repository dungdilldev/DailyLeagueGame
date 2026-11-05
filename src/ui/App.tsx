import { useEffect } from 'preact/hooks';
import { formatUtcDate } from '../game/date';
import type { GameMode } from '../game/gameMode';
import { getBrowserStorage } from '../storage/progressStore';
import { modesFinishedOn } from '../storage/playedModes';
import { AdSlot } from './AdSlot';
import { EndlessScreen } from './EndlessScreen';
import { ModeNav } from './ModeNav';
import { PrivacySettingsLink } from './PrivacySettingsLink';
import { PuzzleScreen } from './PuzzleScreen';
import { SupportButton } from './SupportButton';
import { cleanSeed, randomSeed } from './randomSeed';
import { useGameFile } from './useGameFile';

// Evaluated once per page load: "today" stays fixed until the player reloads after midnight UTC.
const TODAY = formatUtcDate(new Date());
const SHARE_URL = window.location.origin + window.location.pathname;
const MODE_PARAM = 'mode';
const SEED_PARAM = 'seed';
const ENDLESS_MODE = 'endless';
/** Earlier days could be opened with `?date=` until 2026-11-05; such links now open today. */
const OLD_DATE_PARAM = 'date';

// A testing tool, so it only exists in development builds: Vite replaces `import.meta.env.DEV`
// with `false` in production and drops the endless screen from the bundle.
const isEndlessMode =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get(MODE_PARAM) === ENDLESS_MODE;

function readInitialSeed(): string {
  return cleanSeed(new URLSearchParams(window.location.search).get(SEED_PARAM)) ?? randomSeed();
}

function removeOldDateFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(OLD_DATE_PARAM)) return;
  url.searchParams.delete(OLD_DATE_PARAM);
  window.history.replaceState(null, '', url);
}

/** Puts the endless mode's seed in the address, so reloading or sharing the link repeats it. */
function showSeedInUrl(seed: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(SEED_PARAM, seed);
  window.history.replaceState(null, '', url);
}

function Body({ mode }: { mode: GameMode }) {
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
          date={TODAY}
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
  useEffect(removeOldDateFromUrl, []);

  return (
    <>
      {isEndlessMode ? (
        <p class="mode-link">
          <a href={window.location.pathname}>&larr; Back to the daily puzzle</a>
        </p>
      ) : (
        <div class="game__toolbar">
          <ModeNav mode={mode} finished={modesFinishedOn(getBrowserStorage(), TODAY)} />
        </div>
      )}
      <Body mode={mode} />
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
