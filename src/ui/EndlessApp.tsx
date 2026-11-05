import { EndlessScreen } from './EndlessScreen';
import { SupportButton } from './SupportButton';
import { cleanSeed, randomSeed } from './randomSeed';
import { useGameFile } from './useGameFile';

const SEED_PARAM = 'seed';

function readInitialSeed(): string {
  return cleanSeed(new URLSearchParams(window.location.search).get(SEED_PARAM)) ?? randomSeed();
}

/** Puts the endless mode's seed in the address, so reloading or sharing the link repeats it. */
function showSeedInUrl(seed: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(SEED_PARAM, seed);
  window.history.replaceState(null, '', url);
}

function Body() {
  const state = useGameFile();

  switch (state.kind) {
    case 'loading':
      return <p role="status">Loading the questions&hellip;</p>;
    case 'error':
      return (
        <p role="alert">
          Something went wrong loading the game data ({state.message}). Try reloading the page.
        </p>
      );
    case 'ready':
      return (
        <EndlessScreen
          data={state.data}
          initialSeed={readInitialSeed()}
          onSeedChange={showSeedInUrl}
        />
      );
  }
}

/**
 * The endless testing mode (`?mode=endless`). Only development builds have it: it loads the full
 * data files and the generator, which the daily pages never need.
 */
export function EndlessApp() {
  return (
    <>
      <p class="mode-link">
        <a href={window.location.pathname}>&larr; Back to the daily puzzle</a>
      </p>
      <Body />
      <SupportButton />
    </>
  );
}
