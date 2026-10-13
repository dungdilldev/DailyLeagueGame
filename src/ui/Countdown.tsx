import { useEffect, useState } from 'preact/hooks';
import { formatCountdown, formatUtcDate, msUntilNextUtcDay } from '../game/date';

const TICK_MS = 1000;

interface CountdownProps {
  /** UTC date of the puzzle just played; once the clock moves past it, a new puzzle is out. */
  puzzleDate: string;
}

/** Counts down to the next UTC midnight, then offers a reload to pick up the new puzzle. */
export function Countdown({ puzzleDate }: CountdownProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  if (formatUtcDate(now) !== puzzleDate) {
    return (
      <p class="countdown">
        A new puzzle is ready.{' '}
        <button
          type="button"
          class="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          Play it
        </button>
      </p>
    );
  }

  return (
    <p class="countdown">
      Next puzzle in <time>{formatCountdown(msUntilNextUtcDay(now))}</time> (resets at 00:00 UTC)
    </p>
  );
}
