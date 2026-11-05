import { render, type ComponentChild } from 'preact';
import { parseGameMode } from './game/gameMode';
import { App } from './ui/App';
import { PENDING_CLASS, readPuzzleDays } from './ui/embeddedPuzzleDays';
import './ui/styles.css';
import './pages/site.css';
import './ui/game.css';

const ENDLESS_MODE = 'endless';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount element on the game page');
}

/** Replaces the markup the build put into the page with the live app. */
function show(container: HTMLElement, app: ComponentChild): void {
  container.textContent = '';
  render(app, container);
  container.classList.remove(PENDING_CLASS);
}

// A testing tool, so it only exists in development builds: Vite replaces `import.meta.env.DEV`
// with `false` in production and drops this branch, and the data and generator it loads.
if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('mode') === ENDLESS_MODE
) {
  void import('./ui/EndlessApp').then(({ EndlessApp }) => {
    show(root, <EndlessApp />);
  });
} else {
  // Each mode has its own page (stats.html, lore.html, ...), which names its mode on the mount element.
  show(root, <App mode={parseGameMode(root.dataset['mode'])} days={readPuzzleDays(document)} />);
}
