import { earliestPlayableDate } from '../game/archive';
import { addUtcDays, formatDayLabel } from '../game/date';

interface DayNavProps {
  /** The puzzle day currently shown. */
  date: string;
  /** The real current UTC day; the latest day that can be shown. */
  today: string;
  onChange: (date: string) => void;
}

/** Previous/next day buttons, limited to the archive window ending today. */
export function DayNav({ date, today, onChange }: DayNavProps) {
  const isToday = date === today;

  return (
    <nav class="day-nav" aria-label="Choose puzzle day">
      <button
        type="button"
        class="day-nav__button"
        aria-label="Previous day"
        disabled={date <= earliestPlayableDate(today)}
        onClick={() => {
          onChange(addUtcDays(date, -1));
        }}
      >
        &larr; Previous<span class="day-nav__optional"> day</span>
      </button>
      <p class="day-nav__current" aria-live="polite">
        <time class="day-nav__date" dateTime={date}>
          {formatDayLabel(date)}
        </time>
        <span class="day-nav__label">{isToday ? 'Today' : 'Earlier puzzle'}</span>
      </p>
      <button
        type="button"
        class="day-nav__button"
        aria-label="Next day"
        disabled={isToday}
        onClick={() => {
          onChange(addUtcDays(date, 1));
        }}
      >
        Next<span class="day-nav__optional"> day</span> &rarr;
      </button>
    </nav>
  );
}
