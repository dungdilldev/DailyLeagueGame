// Entry for the start page. Its text is plain HTML; this only adds the live countdown and marks
// the modes already played today, so the page reads the same without JavaScript.
import { render } from 'preact';
import { formatUtcDate } from '../game/date';
import { getBrowserStorage } from '../storage/progressStore';
import { modesFinishedOn } from '../storage/playedModes';
import { Countdown } from '../ui/Countdown';
import '../ui/styles.css';

const today = formatUtcDate(new Date());

const countdown = document.getElementById('landing-countdown');
if (countdown) {
  // Replaces the static fallback line instead of diffing against it.
  countdown.textContent = '';
  render(<Countdown puzzleDate={today} />, countdown);
}

for (const mode of modesFinishedOn(getBrowserStorage(), today)) {
  const status = document.querySelector(`.mode-card[data-mode="${mode}"] .mode-card__status`);
  if (status instanceof HTMLElement) status.hidden = false;
}
