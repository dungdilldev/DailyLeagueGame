export type CardState = 'idle' | 'correct' | 'wrong' | 'other';

interface ChampionCardProps {
  name: string;
  iconUrl: string | undefined;
  /** Revealed stat value; shown only after the player has answered. */
  value: number | undefined;
  state: CardState;
  disabled: boolean;
  onSelect: () => void;
}

const STATE_LABEL: Record<CardState, string | undefined> = {
  idle: undefined,
  correct: 'Highest',
  wrong: 'Your pick',
  other: undefined,
};

export function ChampionCard({
  name,
  iconUrl,
  value,
  state,
  disabled,
  onSelect,
}: ChampionCardProps) {
  return (
    <button type="button" class={`card card--${state}`} disabled={disabled} onClick={onSelect}>
      {iconUrl && <img class="card__icon" src={iconUrl} alt="" width={96} height={96} />}
      <span class="card__name">{name}</span>
      {value !== undefined && <span class="card__value">{value.toLocaleString('en-US')}</span>}
      {STATE_LABEL[state] && <span class="card__tag">{STATE_LABEL[state]}</span>}
    </button>
  );
}
