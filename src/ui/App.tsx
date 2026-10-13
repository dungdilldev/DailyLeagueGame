import { formatUtcDate } from '../game/date';

export function App() {
  return (
    <main>
      <h1>DailyLeague</h1>
      <p>Today is {formatUtcDate(new Date())} (UTC). Game coming soon.</p>
    </main>
  );
}
