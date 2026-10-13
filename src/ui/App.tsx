import { formatUtcDate } from '../game/date';
import { getBrowserStorage } from '../storage/progressStore';
import { Footer } from './Footer';
import { Game } from './Game';
import { useGameData } from './useGameData';

// Evaluated once per page load: the puzzle day is fixed until the player reloads after midnight UTC.
const TODAY = formatUtcDate(new Date());
const SHARE_URL = window.location.origin + window.location.pathname;

function Body() {
  const data = useGameData(TODAY);

  switch (data.kind) {
    case 'loading':
      return <p role="status">Loading today&apos;s puzzle&hellip;</p>;
    case 'missing':
      return <p role="alert">There is no puzzle for {data.date} yet. Please check back later.</p>;
    case 'error':
      return (
        <p role="alert">
          Something went wrong loading the puzzle ({data.message}). Try reloading the page.
        </p>
      );
    case 'ready':
      return (
        <Game
          puzzle={data.puzzle}
          champions={data.champions}
          today={TODAY}
          storage={getBrowserStorage()}
          shareUrl={SHARE_URL}
        />
      );
  }
}

export function App() {
  return (
    <div class="app">
      <header>
        <h1>DailyLeague</h1>
        <p class="tagline">Daily League of Legends higher-or-lower. {TODAY}</p>
      </header>
      <main>
        <Body />
      </main>
      <Footer />
    </div>
  );
}
