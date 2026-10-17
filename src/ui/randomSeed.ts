const SEED_RADIX = 36;
const SEED_LENGTH = 6;
const MAX_SEED_LENGTH = 40;

/** A short random seed for the endless mode. Random on purpose: this is not game logic. */
export function randomSeed(): string {
  return Math.random()
    .toString(SEED_RADIX)
    .slice(2, 2 + SEED_LENGTH);
}

/** A seed from the address bar, kept short so it stays readable. Empty counts as missing. */
export function cleanSeed(value: string | null): string | undefined {
  const trimmed = value?.trim().slice(0, MAX_SEED_LENGTH);
  return trimmed ? trimmed : undefined;
}
