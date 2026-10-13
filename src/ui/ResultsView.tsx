import { useState } from 'preact/hooks';
import type { Puzzle } from '../data/puzzleSchema';
import { roundResults } from '../game/progress';
import { buildShareText } from '../game/share';
import { Countdown } from './Countdown';

interface ResultsViewProps {
  puzzle: Puzzle;
  answers: readonly string[];
  streak: number;
  shareUrl: string;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

export function ResultsView({ puzzle, answers, streak, shareUrl }: ResultsViewProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const results = roundResults(puzzle, answers);
  const correct = results.filter(Boolean).length;
  const shareText = buildShareText(puzzle.date, results, shareUrl);

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
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" class="question">
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
          <li key={round.statId}>
            <span aria-hidden="true">{results[i] ? '\u{1F7E9}' : '\u{1F7E5}'}</span>{' '}
            {round.statLabel}
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

      <Countdown puzzleDate={puzzle.date} />
    </section>
  );
}
