import { useState } from 'preact/hooks';
import type { Puzzle } from '../game/puzzle';
import { roundResults } from '../game/progress';
import type { GameMode } from '../game/gameMode';
import { MIXED_MODE } from '../game/gameMode';
import { buildShareText } from '../game/share';
import { Countdown } from './Countdown';
import { MODE_LABELS } from './modeLabels';

interface ResultsViewProps {
  puzzle: Puzzle;
  answers: readonly string[];
  streak: number;
  shareUrl: string;
  /** False for an earlier day from the archive: no countdown, and a note about the streak. */
  isToday: boolean;
  mode: GameMode;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

export function ResultsView({
  puzzle,
  answers,
  streak,
  shareUrl,
  isToday,
  mode,
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
      <p class="results-panel__eyebrow">{isToday ? 'Today’s result' : 'Earlier puzzle'}</p>
      <h2 id="results-heading" class="results-panel__score">
        You got{' '}
        <strong>
          {correct}/{results.length}
        </strong>
      </h2>
      <p class="streak">
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
            <span class="visually-hidden">{results[i] ? ' (correct)' : ' (wrong)'}</span>
          </li>
        ))}
      </ol>

      <button type="button" class="button" onClick={copyResult}>
        {copyStatus === 'copied' ? 'Copied!' : 'Share result'}
      </button>
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

      {isToday ? (
        <Countdown puzzleDate={puzzle.date} />
      ) : (
        <p class="countdown">
          This was an earlier puzzle, so it does not count towards your streak. Use “Next day” to
          get back to today.
        </p>
      )}
    </section>
  );
}
