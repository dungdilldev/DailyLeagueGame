import { useState } from 'preact/hooks';
import type { Puzzle } from '../game/puzzle';
import { roundResults } from '../game/progress';
import type { GameMode } from '../game/gameMode';
import { MIXED_MODE } from '../game/gameMode';
import { buildShareText } from '../game/share';
import { Countdown } from './Countdown';
import { Icon } from './icons';
import { MODE_LABELS } from './modeLabels';
import { modePageHref } from './modePages';

interface ResultsViewProps {
  puzzle: Puzzle;
  answers: readonly string[];
  streak: number;
  shareUrl: string;
  mode: GameMode;
  /** A mode not finished yet today, offered as the next one to play. */
  nextMode?: GameMode;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

export function ResultsView({
  puzzle,
  answers,
  streak,
  shareUrl,
  mode,
  nextMode,
}: ResultsViewProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const results = roundResults(puzzle, answers);
  const correct = results.filter(Boolean).length;
  const shareText = buildShareText(
    puzzle.date,
    results,
    shareUrl,
    mode === MIXED_MODE ? undefined : MODE_LABELS[mode],
  );

  const copyResult = () => {
    navigator.clipboard.writeText(shareText).then(
      () => {
        setCopyStatus('copied');
      },
      () => {
        setCopyStatus('failed');
      },
    );
  };

  return (
    <section class="results-panel" aria-labelledby="results-heading">
      <p class="results-panel__eyebrow">Today’s result · {MODE_LABELS[mode]}</p>
      <h2 id="results-heading" class="results-panel__score">
        You got{' '}
        <strong>
          {correct}/{results.length}
        </strong>
      </h2>
      <p class="streak">
        <Icon name="flame" size={20} />
        {streak > 0 ? `Streak: ${String(streak)} day${streak === 1 ? '' : 's'}` : 'No streak yet'}
      </p>

      <ol class="results">
        {puzzle.rounds.map((round, i) => (
          <li key={round.questionId} class="results__row">
            <span
              class={`result-tile ${results[i] ? 'result-tile--ok' : 'result-tile--bad'}`}
              aria-hidden="true"
            >
              {results[i] ? '✓' : '✕'}
            </span>
            <span class="results__label">{round.statLabel}</span>
            <span class="results__outcome">{results[i] ? 'Correct' : 'Wrong'}</span>
          </li>
        ))}
      </ol>

      <div class="results-panel__actions">
        <button type="button" class="button button--large" onClick={copyResult}>
          <Icon name="share" />
          {copyStatus === 'copied' ? 'Copied!' : 'Share result'}
        </button>
        {nextMode && (
          <a class="button button--large button--secondary" href={modePageHref(nextMode)}>
            Play {MODE_LABELS[nextMode]} next
          </a>
        )}
      </div>
      {copyStatus === 'failed' && (
        <div class="share-fallback" role="alert">
          <p>Could not copy automatically. Copy this text instead:</p>
          <textarea
            readOnly
            rows={3}
            value={shareText}
            onFocus={(e) => {
              e.currentTarget.select();
            }}
          />
        </div>
      )}

      <Countdown puzzleDate={puzzle.date} />
    </section>
  );
}
