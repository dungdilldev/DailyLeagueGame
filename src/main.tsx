import { render } from 'preact';
import { parseGameMode } from './game/gameMode';
import { App } from './ui/App';
import './ui/styles.css';
import './pages/site.css';
import './ui/game.css';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount element on the game page');
}
// Each mode has its own page (stats.html, lore.html, ...), which names its mode on the mount element.
render(<App mode={parseGameMode(root.dataset['mode'])} />, root);
