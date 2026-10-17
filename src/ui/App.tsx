import { useState } from 'preact/hooks';
import { resolvePuzzleDate } from '../game/archive';
import { formatUtcDate } from '../game/date';
import { getBrowserStorage } from '../storage/progressStore';
import { DayNav } from './DayNav';
import { EndlessScreen } from './EndlessScreen';
import { Footer } from './Footer';
import { PuzzleScreen } from './PuzzleScreen';
import { cleanSeed, randomSeed } from './randomSeed';
import { useGameFile } from './useGameFile';

// Evaluated once per page load: "today" stays fixed until the player reloads after midnight UTC.
const TODAY = formatUtcDate(new Date());
const SHARE_URL = window.location.origin + window.location.pathname;
const DATE_PARAM = 'date';
const MODE_PARAM = 'mode';
const SEED_PARAM = 'seed';
const ENDLESS_MODE = 'endless';

const isEndlessMode = new URLSearchParams(window.location.search).get(MODE_PARAM) === ENDLESS_MODE;

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

function Body({ date }: { date: string }) {
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
          date={date}
          today={TODAY}
          storage={getBrowserStorage()}
          shareUrl={SHARE_URL}
        />
      );
  }
}

export function App() {
  const [date, setDate] = useState(readRequestedDate);

  const changeDate = (next: string) => {
    setDate(next);
    showDateInUrl(next);
  };

  return (
    <div class="app">
      <header>
        <h1>DailyLeague</h1>
        <p class="tagline">Daily League of Legends higher-or-lower.</p>
      </header>
      <main>
        {isEndlessMode ? (
          <p class="mode-link">
            <a href={window.location.pathname}>&larr; Back to the daily puzzle</a>
          </p>
        ) : (
          <DayNav date={date} today={TODAY} onChange={changeDate} />
        )}
        <Body date={date} />
        {!isEndlessMode && (
          <p class="mode-link">
            <a href={`?${MODE_PARAM}=${ENDLESS_MODE}`}>Endless mode (for testing)</a>
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
