export type CardState = 'idle' | 'correct' | 'wrong' | 'other';

interface OptionCardProps {
  name: string;
  iconUrl: string | undefined;
  /** A region or group crest rather than a portrait: drawn without the portrait frame. */
  isSymbol?: boolean;
  /** Revealed stat value as display text; shown only after the player has answered. */
  valueText: string | undefined;
  state: CardState;
  /** Label shown on the right option and on the player's wrong pick once revealed. */
  tag: string | undefined;
  disabled: boolean;
  onSelect: () => void;
}

export function OptionCard({
  name,
  iconUrl,
  isSymbol = false,
  valueText,
  state,
  tag,
  disabled,
  onSelect,
}: OptionCardProps) {
  return (
    <button
      type="button"
      class={`card card--${state}${iconUrl ? '' : ' card--plain'}`}
      disabled={disabled}
      onClick={onSelect}
    >
      {iconUrl && (
        <img
          class={isSymbol ? 'card__icon card__icon--symbol' : 'card__icon'}
          src={iconUrl}
          alt=""
          width={96}
          height={96}
        />
      )}
      <span class="card__name">{name}</span>
      {valueText !== undefined && <span class="card__value">{valueText}</span>}
      {tag && <span class="card__tag">{tag}</span>}
    </button>
  );
}
