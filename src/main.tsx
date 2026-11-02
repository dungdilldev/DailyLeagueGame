import { render } from 'preact';
import { App } from './ui/App';
import './ui/styles.css';
import './pages/site.css';
import './ui/game.css';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount element in play.html');
}
render(<App />, root);
