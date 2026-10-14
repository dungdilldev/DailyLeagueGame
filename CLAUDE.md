# DailyLeague

A daily League of Legends "higher or lower"-style quiz. Each day the player gets rounds of 4 champions and must pick the one with the highest value of a stat (win rate, pick rate, skin count, release date, base HP, ...). Static website, no backend. New quizzes are generated automatically.

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the roadmap and phase status, and [docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md) for how to run and test locally.

## Tech Stack

- **Frontend:** Vite + TypeScript (strict) + Preact (or vanilla TS if the UI stays small). CSS modules / plain CSS, no heavy UI framework.
- **Data pipeline:** Node.js scripts in TypeScript, run via `tsx`. Runs in GitHub Actions on a cron.
- **Tests:** Vitest (unit, plus Testing Library for the UI flow), Playwright (a few e2e smoke tests, Phase 4).
- **Hosting:** Static hosting (GitHub Pages or Cloudflare Pages). No server, no database. Player state lives in `localStorage`.
- **Lint/format:** ESLint + Prettier. Config is the source of truth, don't argue with it.

## Repository Layout

```
src/
  game/        Pure game logic (no DOM, no fetch): puzzle generator (generate/), scoring, streaks, formatting. Fully unit-tested.
  ui/          Components and rendering. No game rules here.
  data/        Loading and validating the published JSON at runtime.
  storage/     localStorage wrapper (streaks, history, settings).
pipeline/
  sources/     One module per external data source (Data Dragon, stats provider, ...).
  stats/       Stat definitions: how each stat is fetched, normalised, labelled.
  validate/    Sanity checks for the fetched champion data.
  snapshots.ts Decides when new data takes effect (see Domain Rules).
public/
  data/        Generated output: game-data.json (stat definitions + champion snapshots), committed by CI.
tests/         Mirrors src/ and pipeline/ structure; tests/support has test-only helpers.
```

## Commands

Keep this list accurate, it is the first thing to check. Node 22+ (see `.nvmrc`).

- `npm run dev` - local dev server
- `npm run build` - typecheck + production build
- `npm run check` - typecheck + lint + format check + unit tests (run before pushing, plus `test:e2e`)
- `npm test` - unit tests (`npm run test:watch` for watch mode)
- `npm run test:e2e` - Playwright smoke tests against a fresh production build (first time: `npx playwright install chromium`)
- `npm run lint` / `npm run typecheck`
- `npm run format` / `npm run format:check` - Prettier
- `npm run data:refresh` - fetch Data Dragon, update `public/data/game-data.json` (needs network)

## Domain Rules (non-obvious, easy to get wrong)

- **Puzzles are generated in the browser, not stored.** `createDailyPuzzle(data, date)` builds the day's puzzle from `game-data.json`; there are no puzzle files. Answers are therefore inspectable by anyone: this is a casual game, do not treat them as secret.
- **Determinism:** the same date + same data snapshot must always produce the same puzzle, for every player. Use the seeded PRNG (seed = date string), never `Math.random()`, and no clock inside generator code.
- **Archive:** players can open today and the previous `ARCHIVE_DAYS` (7) days via `?date=YYYY-MM-DD` or the day buttons; anything else falls back to today. Days played after their own date are saved with `late: true` and do not count for the streak. Snapshots are kept long enough to rebuild every archive day exactly as it was.
- **Snapshots:** `game-data.json` holds the snapshot in effect plus any upcoming one. New or changed data becomes a snapshot with `effectiveFrom` = next UTC day, so a day's puzzle never changes once that day has started. The client picks the newest snapshot with `effectiveFrom <= today`. Never edit a snapshot that is already in effect.
- **Date handling:** the "day" is defined in **UTC**. Never use local time to pick the puzzle.
- **Fair, escalating rounds:** all 4 champions in a round have distinct values. The relative gap between first and second place must fall in the round's band from `pipeline/generate/config.ts`; bands narrow each round so later rounds are harder. Win rate / pick rate comparisons (Phase 5) should stay within the same role and patch.
- **Data sources:** Data Dragon (official) and the LoL Wiki champion data module (release dates). Each lives in one file under `pipeline/sources/`. A stat may return `undefined` for a champion (e.g. not on the wiki yet); validation requires 95% coverage per stat rather than 100%.
- **Stat provenance:** each stat definition carries its `source`, published in `game-data.json`. Stat definitions (label, question, format) are data too: the client has no stat-specific code.
- **No official win-rate API exists** (popularity stats are parked, see plan Phase 5b). Riot does not expose aggregate champion win/pick rate. Whatever source is used must be isolated behind the `pipeline/sources` interface so it can be swapped (see the plan, Risks).
- **Riot legal:** include the required "not endorsed by Riot Games" disclaimer in the footer. Do not host Riot assets beyond what Data Dragon / Community Dragon terms allow; hotlink or fetch via CI per their terms.

## Maintainability & Clean Code

These are requirements, not suggestions. Apply them to every change.

**Structure**

- Keep **game logic pure**: functions take data and return data. No DOM, network, clock, or randomness inside them (inject those as parameters). This is what makes it testable.
- **Separate concerns by layer:** `pipeline` (produces data) -> `data` (loads/validates) -> `game` (rules) -> `ui` (renders). Dependencies only point in that direction. `ui` must not import from `pipeline`.
- One module = one responsibility. If a file needs "and" to describe it, split it. Aim for files under ~200 lines and functions under ~30.
- **Adding a new stat must be one new file** in `pipeline/stats/` plus registration in one list. If it requires touching the UI or generator, the abstraction is wrong, fix the abstraction.

**Code style**

- TypeScript `strict`. No `any`; use `unknown` and narrow. No non-null `!` assertions without a comment explaining why.
- Names describe intent (`pickHighestChampion`, not `process`). No abbreviations except domain-standard ones (`wr` is not one, write `winRate`).
- Prefer small pure functions, early returns, and immutable data. Avoid deep nesting (max 3 levels).
- No magic numbers or strings: put them in named constants or config (e.g. `MIN_STAT_GAP`, `ROUNDS_PER_DAY`).
- Don't duplicate. Third repetition means extract; but don't abstract on the first use.
- Comments explain **why**, not what. Delete commented-out code. No TODOs without an issue or plan reference.

**Data & errors**

- Validate all external data at the boundary (Zod or equivalent). Everything past the boundary is typed and trusted.
- The pipeline must **fail loudly**: if a source returns bad/partial data, the CI run fails and the previous good data stays live. Never publish a puzzle built from invalid data.
- The client must degrade gracefully: if today's puzzle file is missing, show a clear message (or fall back to the latest available puzzle), never a blank page.

**Testing**

- Every function in `src/game` (including the generator) and `pipeline` has unit tests, including edge cases (ties, missing stat, patch change, date boundary at UTC midnight).
- Add a regression test with every bug fix.
- Generator has a property-style test: for N seeds, every produced round is valid (4 distinct champions, unique max, gap respected).
- Don't mock what you own. Mock only network and clock.

**Dependencies**

- Be sceptical of new dependencies. Prefer the platform and the standard library. Pin versions; justify each addition in the PR/commit message.

**Workflow**

- Small, focused commits with imperative messages ("Add skin count stat"). One concern per commit.
- Keep `IMPLEMENTATION_PLAN.md` current: tick off tasks as done, record decisions that change the plan.
- Update this file when a convention changes. Stale docs are bugs.
- Before finishing a task: typecheck, lint, tests pass; no unused code or exports left behind.

## Working Agreement for Claude

- Check `IMPLEMENTATION_PLAN.md` for the current phase before starting; don't build ahead of it without asking.
- Ask before adding a data source that scrapes a third-party site (ToS / legal risk).
- Prefer the smallest change that solves the problem; don't refactor unrelated code in the same change.
- When unsure about a game-design choice (scoring, difficulty, stat list), propose options rather than silently picking one.
