// Entry for the start page. Its text is plain HTML; this only adds today's date, the live
// countdown, the answerable sample round and the marks on modes already played today, so the page
// reads the same without JavaScript.
import { render } from 'preact';
import { formatDayLabel, formatUtcDate } from '../game/date';
import { getBrowserStorage } from '../storage/progressStore';
import { modesFinishedOn } from '../storage/playedModes';
import { Countdown } from '../ui/Countdown';
import { enableSampleRound } from './sampleRound';
import '../ui/styles.css';
import './site.css';
import './landing.css';

const today = formatUtcDate(new Date());

const dateLabel = document.getElementById('landing-date');
if (dateLabel) dateLabel.textContent = `Daily puzzle · ${formatDayLabel(today)}`;

const countdown = document.getElementById('landing-countdown');
if (countdown) {
  // Replaces the static fallback line instead of diffing against it.
  countdown.textContent = '';
  render(<Countdown puzzleDate={today} />, countdown);
}

const sampleRound = document.querySelector('[data-sample-round]');
if (sampleRound instanceof HTMLElement) enableSampleRound(sampleRound);

for (const mode of modesFinishedOn(getBrowserStorage(), today)) {
  const card = document.querySelector(`.mode-card[data-mode="${mode}"]`);
  const status = card?.querySelector('.mode-card__status');
  const callToAction = card?.querySelector('.mode-card__cta');
  if (status instanceof HTMLElement) status.hidden = false;
  if (callToAction instanceof HTMLElement) callToAction.hidden = true;
}
