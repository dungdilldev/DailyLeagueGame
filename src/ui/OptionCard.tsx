export type CardState = 'idle' | 'correct' | 'wrong' | 'other';

interface OptionCardProps {
  name: string;
  iconUrl: string | undefined;
  /** A region or group crest rather than a portrait: drawn without the portrait frame. */
  isSymbol?: boolean;
  /** Stat value as display text; its line is always reserved so revealing it moves nothing. */
  valueText: string | undefined;
  /** False until the player has answered: the value takes up space but is invisible. */
  valueRevealed: boolean;
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
  valueRevealed,
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
      {valueText !== undefined && (
        <span class={valueRevealed ? 'card__value' : 'card__value card__value--hidden'}>
          {valueText}
        </span>
      )}
      {tag && <span class="card__tag">{tag}</span>}
    </button>
  );
}
