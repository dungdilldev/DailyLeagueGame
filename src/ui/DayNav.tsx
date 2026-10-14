import { earliestPlayableDate } from '../game/archive';
import { addUtcDays } from '../game/date';

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
        disabled={date <= earliestPlayableDate(today)}
        onClick={() => {
          onChange(addUtcDays(date, -1));
        }}
      >
        &larr; Previous day
      </button>
      <p class="day-nav__current" aria-live="polite">
        <time dateTime={date}>{date}</time>
        <span class="day-nav__label">{isToday ? 'Today' : 'Earlier puzzle'}</span>
      </p>
      <button
        type="button"
        class="day-nav__button"
        disabled={isToday}
        onClick={() => {
          onChange(addUtcDays(date, 1));
        }}
      >
        Next day &rarr;
      </button>
    </nav>
  );
}
