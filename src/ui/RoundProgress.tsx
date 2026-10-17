interface RoundProgressProps {
  /** Index of the round being shown. */
  current: number;
  total: number;
  /** One entry per answered round: true if it was answered correctly. */
  results: readonly boolean[];
}

function pipClass(index: number, current: number, results: readonly boolean[]): string {
  const result = results[index];
  if (result !== undefined) return result ? 'pip pip--ok' : 'pip pip--bad';
  return index === current ? 'pip pip--current' : 'pip';
}

/**
 * A row of tiles, one per round: green or red once answered, highlighted for the current one.
 * Purely visual; the "Round x of y" text next to it carries the same information.
 */
export function RoundProgress({ current, total, results }: RoundProgressProps) {
  return (
    <ol class="pips" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <li key={index} class={pipClass(index, current, results)} />
      ))}
    </ol>
  );
}
