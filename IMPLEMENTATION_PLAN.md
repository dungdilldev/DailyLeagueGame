# DailyLeague - Implementation Plan

Status legend: `[ ]` todo, `[x]` done. Update as work progresses.

## 1. Product Definition

**Core loop:** the player sees 4 champions and a question ("Which champion has the highest _win rate_?"). They pick one, get instant feedback with the real numbers, and move to the next round.

**Assumed design (confirm or change before Phase 2):**

- 5 rounds per day, each with a different stat. Score out of 5, shareable result (emoji grid, like Wordle).
- Same puzzle for every player on a given UTC day.
- Streak and history stored locally in the browser. No accounts.
- Later: optional "unlimited/practice" mode using random rounds.

**Candidate stats**

| Stat                                            | Source                            | Notes                                 |
| ----------------------------------------------- | --------------------------------- | ------------------------------------- |
| Skin count                                      | Data Dragon / Community Dragon    | Easy, stable                          |
| Release date                                    | LoL Wiki / Data Dragon (ordering) | Stable, ask "newest" or "oldest"      |
| Base HP, armor, AD, move speed, attack range... | Data Dragon `champion/<id>.json`  | Free, official, stable                |
| Ability count / cheapest-skin price             | Wiki / CDragon                    | Optional                              |
| Win rate, pick rate, ban rate                   | **Third-party only** (see Risks)  | Changes per patch, needs snapshotting |
| Mastery / "total points" style stats            | Riot API (needs key)              | Stretch goal                          |

## 2. Architecture

```
GitHub Actions (cron, daily)
   |
   v
pipeline/sources  -> fetch Data Dragon + LoL Wiki
pipeline/validate -> sanity checks, fail loudly
pipeline/snapshots-> new data becomes a snapshot effective from the next UTC day
   |
   v
public/data/champions.json + items.json  (stats + snapshots; committed only when data changes)
data/questions.json  (hand-edited question templates, bundled into the app)
   |
   v
Static site (Vite build) -> GitHub Pages
   |
   v
Browser: load both data files, pick each file's snapshot for today (UTC), generate the day's puzzle
         with the date-seeded generator (src/game/generate), play, store result in localStorage
```

**Why static + generate in the browser:** zero hosting cost, no server, no per-day files in the repo. The generator is deterministic (seed = UTC date), so every player gets the same puzzle. Snapshots with an `effectiveFrom` date keep a day's puzzle stable when data changes. Trade-off: answers are inspectable by anyone (a server would be needed to hide them).

**Self-healing:** if a refresh fails, the site keeps serving the last good data. Puzzles keep generating from it.

## 3. Data Model (TypeScript sketch)

```ts
type StatId = 'skinCount' | 'releaseDate' | 'baseHealth' | 'winRate' | ...;

interface Champion {
  id: string;            // Data Dragon id, e.g. "MissFortune"
  name: string;
  roles: Role[];
  iconUrl: string;
  stats: Partial<Record<StatId, StatValue>>;
}

interface StatValue { value: number; source: string; patch?: string; }

interface Round {
  statId: StatId;
  direction: 'highest' | 'lowest';
  championIds: [string, string, string, string];
  answerId: string;
  values: Record<string, number>;   // snapshot shown after answering
}

interface Puzzle { date: string /* YYYY-MM-DD UTC */; patch: string; rounds: Round[]; }
```

## 4. Phases

### Phase 0 - Project setup

- [x] Init git repo, `.gitignore`, Node version file
- [x] Scaffold Vite + TypeScript (strict), ESLint, Prettier, Vitest
- [x] CI workflow: typecheck, lint, test on PRs (written; not yet run on GitHub, no remote exists)
- [x] Fill in the Commands section of `CLAUDE.md`

**Done when:** `npm run dev/test/lint/typecheck` all work on an empty app and CI is green.

### Phase 1 - Data pipeline (official data only)

- [x] `sources/dataDragon.ts`: fetch latest version, champion list, per-champion detail
- [x] Zod schemas for raw responses and for our `Champion` model (`src/data/schema.ts`)
- [x] Stat modules: `skinCount`, `baseHealth`, `armor`, `magicResist`, `attackDamage`, `attackRange`, `moveSpeed`
- [x] `releaseDate` stat from the LoL Wiki (`pipeline/sources/leagueWiki.ts`), added in the "more official stats" step below
- [x] Stat registry (single list) so new stats = one file
- [x] `npm run data:refresh` writes `public/data/champions.json`
- [x] Unit tests with injected fetchers (no live network in tests)

**Notes / deviations:**

- Data Dragon "tags" are champion classes (Mage, Assassin), not lanes, so the model has `classes`, not `roles`. Lane roles arrive with Phase 5.
- `skinCount` excludes the default skin and parenthesised variants (chromas, prestige editions), because Data Dragon lists those as separate skins.

**Done when:** `champions.json` is produced from live data, validated, and all stat modules have tests.

### Phase 2 - Puzzle generator

- [x] Seeded PRNG util (date string -> seed)
- [x] Round builder: constructive (answer, runner-up inside the difficulty band, two lower champions); distinct values enforced
- [x] Puzzle builder: 5 rounds, no repeated stat or champion within a day
- [x] Difficulty config in one file (`pipeline/generate/config.ts`): gap bands narrow each round
- [x] ~~`npm run data:generate` writing puzzle files~~ replaced in Phase 5c by in-browser generation
- [x] Determinism test, validator tests, and a 365-date test against the real roster
- [ ] Avoid champion repeats across consecutive days (not done: each day is generated independently from its date)

**Difficulty:** gap = (best - second) / best. Round 1: 30%+, round 2: 18-30%, round 3: 10-18%, round 4: 5-10%, round 5: 2-5%. Stats that cannot reach a band (e.g. move speed at 30%) are skipped for that round automatically.

**Done when:** generating 365 days produces zero invalid rounds and re-running yields identical output.

### Phase 3 - Game logic & UI (MVP)

- [x] `game/`: `submitAnswer`, `roundResults`, `score`, `currentStreak`, `buildShareText` as pure functions; `data/loaders.ts` loads and validates puzzle files
- [x] UI: round screen (4 champion cards, question, progress), reveal screen (values shown), results screen
- [x] localStorage: today's progress (resume after refresh), streak, history (`src/storage/progressStore.ts`)
- [x] Share button (emoji result text copied to clipboard, textarea fallback if copy fails)
- [x] Error states: puzzle missing, load failure, corrupt/blocked storage
- [x] Mobile-first layout, buttons/labels/focus handling, status announcements (screen-reader behaviour not tested with a real screen reader)
- [x] Riot disclaimer in footer
- [ ] Visual check in a real browser on desktop and phone (not done: no browser available in the dev session)
- [ ] Fallback to the latest available puzzle when today's is missing (currently shows a message)

**Done when:** a full daily game is playable end-to-end on desktop and phone with local data.

### Phase 4 - Automation & deployment

- [x] GitHub Actions: daily cron -> refresh data -> generate ahead -> test gate -> commit -> build -> deploy (`.github/workflows/deploy.yml`)
- [x] Pipeline failure keeps previous data live (nothing is committed or deployed) and GitHub emails the owner
- [x] Deploy to GitHub Pages (setup steps in `README.md`)
- [x] Playwright smoke tests against the production build, desktop and phone viewport, run in CI
- [x] New champions/patches handled automatically: the refresh always takes the latest Data Dragon version, and a changed file is committed
- [x] First real run on GitHub: workflow runs and the site is deployed (confirmed). One bug found and fixed: duplicate `github-pages` artifact name on re-runs.
- [ ] Optional: failure notification beyond GitHub's default email

**Done when:** the site updates daily with no manual action for 7 consecutive days. (Still to observe: the daily job has run on GitHub only manually so far.)

### Phase 5a - More stats without popularity data (done)

Decision: win rate / pick rate are skipped for now (no official source). Instead:

- [x] Second source: LoL Wiki champion data (one text request, parsed and validated; fails loudly if the format changes)
- [x] New stats: `releaseDate`, `healthPerLevel`, `healthRegen`, `attackSpeed` (11 stats total)
- [x] Stats can supply their own question and display formatting (`question`, `formatValue`); the puzzle stores them, so the client needs no stat knowledge. Older puzzles without them still load.
- [x] Stat validation is now coverage based (95% of champions) so a champion missing from the wiki on release day does not block the refresh
- [x] Wiki attribution (CC BY-SA 3.0) in the site footer
- Release dates are stored as days since 2009-01-01 so the relative-gap difficulty bands still work.

### Phase 5c - Generate puzzles in the browser (done)

Decision: no puzzle files in the repo; the date-seeded generator runs in the browser.

- [x] Generator moved to `src/game/generate`; stat labels, questions and formats are data (`StatMeta`), not functions
- [x] Data files = stat definitions + snapshots; `pickSnapshot` / `mergeSnapshots` keep a day's puzzle stable when data changes
- [x] `puzzles/` folder, `data:generate` script and generate step in the workflow removed; the daily job only commits and deploys when data actually changed
- [x] Saved answers that do not fit today's puzzle are discarded instead of breaking the game
- [x] The year-of-dates generator test is the CI gate for new data
- First deploy after this change: today's puzzle differs from the old file-based one, so anyone who already played today may see their progress reset once.

### Phase 5c2 - Separate champion data, item data and questions (done)

Decision: maintenance was hard because a stat was both a data column and a question.

- [x] `champions.json` and `items.json` (generated, each with its own stat definitions and snapshots) and `data/questions.json` (hand-edited templates)
- [x] A question names a stat; the stat's file decides champions vs items
- [x] Optional `correct` / `wrong` / `exclude` lists per question; refresh fails if a listed id no longer exists
- [x] A question is asked at most once a day (was: a stat); `Round.statId` became `questionId`, `Puzzle.patch` was removed (two files, no single patch)
- Same 20 questions and same stats as before; the old `game-data.json` was split without refetching, so archive days keep their snapshots.

### Phase 5d - Previous days (done)

- [x] Day navigation (“Previous day” / “Next day”) and `?date=YYYY-MM-DD` in the address; invalid, future and too-old dates fall back to today (`src/game/archive.ts`)
- [x] Window of `ARCHIVE_DAYS` = 7 days back (one constant; set to 1 for “yesterday only”). Data snapshots are pruned to match, so an earlier day is rebuilt from the data that was live then
- [x] Progress is stored per day; days played late are flagged and excluded from the streak
- [x] Earlier-day results show a note instead of the countdown
- [x] Browser tests for navigation, window limit, bad dates and separate progress
- Known limit: after the first deploy of in-browser generation there is only one snapshot, so older archive days are built from it rather than from the data of that day.

### Phase 5e - Documentation (done)

- [x] `docs/LOCAL_TESTING.md`: how to run, play, reset, check and troubleshoot locally; `npm run check` shortcut

### Phase 5f - Item questions and patch-note counts (done)

Decision: more static data instead of popularity stats.

- [x] Items as a second kind of subject: stats have a `subject`, rounds compare four champions or four items (`optionIds`), snapshots hold `items` (older snapshots without items still work)
- [x] Sources: Data Dragon `item.json` (price, icon, availability), wiki `Module:ItemData/data` and `Module:Gold_value/data` (stats incl. ability haste, gold values), parsed with a small Lua table parser
- [x] Item pool: 113 completed legendary items and boots on Summoner's Rift
- [x] 8 item questions: cost, gold efficiency (stats only), attack damage, ability power, health, armor, magic resistance, ability haste
- [x] Champion question “appeared in the most patch notes” from each champion's wiki patch history (counts every patch entry, including bug fixes and hotfixes)
- [x] Percent display format, validation per subject, wiki credit in the footer
- [ ] Not done: counting only real balance changes (would need to classify each patch entry), item stats from Data Dragon cross-checked against the wiki
- Known data issue: the wiki page for K'Sante is garbled at the source, so he shows only 2 patches.

### Phase 5g - Endless testing mode (done)

- [x] `?mode=endless`: endless random questions (uniform over stats, random difficulty), seeded and reproducible (`?seed=`), nothing saved
- [x] Coverage table (asked / correct per question, difficulty histogram, unseen questions in red)
- [x] Filters to force a question and/or a difficulty; says when a combination cannot be built
- [x] Uses the newest snapshot, so upcoming data can be checked before it takes effect
- [x] Tests: seeded determinism, equal weighting, all 20 questions and 5 difficulties appear, screen behaviour, and a browser run that skips through questions until everything is covered

### Phase 5b - Popularity stats (win rate / pick rate) - parked

Revisit only if wanted later. Options and risks are in section 5.

**History:** a full Riot Match-V5 pipeline (sampling, aggregation, rate-limited client, weekly frozen
publishing, `winRate`/`pickRate`/`banRate` stats, a collection workflow and docs) was built and then
removed on request, to keep the project smaller for now. Its first real run worked: 53 EUW Emerald+ games
across 164 champions. The whole change is kept in a local git stash named "Riot popularity pipeline
(parked ...)" (`git stash list`; `git stash pop` brings it back, `git stash drop` discards it).
Scraping Lolalytics was assessed instead and not built: no terms of service or API found, but also no
permission, so it needs the operator's agreement first.

- [ ] Decide provider (see Risks); implement behind the `sources` interface
- [ ] Snapshot per patch, per role; store provenance in `StatValue`
- [ ] Restrict comparisons to same role/rank bracket; document the choice on the site ("Emerald+, patch 15.x")
- [ ] Add stats to the registry and puzzle config

**Done when:** win rate and pick rate rounds appear in generated puzzles with validated data.

### Phase 6 - Polish & growth (optional)

- [ ] Practice/unlimited mode, difficulty modes
- [ ] Stats page (accuracy per stat, streak history)
- [ ] Champion splash art / ability icons, animations, sound toggle
- [ ] Analytics (privacy-friendly, e.g. Plausible/Cloudflare) and OG share image
- [ ] Archive of past puzzles

## 5. Risks & Open Questions

1. **Win rate / pick rate source (biggest risk).** Riot has no aggregate endpoint. Options:
   - **Riot Match-V5 API:** compute our own stats. Official and legal but needs a production API key and a lot of sampling. Heavy for a hobby project.
   - **Third-party sites (u.gg, op.gg, lolalytics, Metasrc):** easy data, but scraping may breach their ToS and can break at any time. Check for official APIs/exports first.
   - **Recommendation:** ship Phases 0-4 on official static stats (still plenty of variety), and treat popularity stats as Phase 5 with an explicit decision. **Needs your call.**
2. **Riot IP / policy:** fan sites are allowed under Riot's Legal Jibber Jabber, but need the disclaimer and compliance with API/Data Dragon terms. If monetising later, re-read the policy.
3. **Stat volatility:** popularity stats change per patch; snapshot into the puzzle at generation time.
4. **Guessability:** some stats (release date vs. skin count) correlate with champion age; the min-gap and mixed stats mitigate this. Tune after playtesting.
5. **Timezone expectations:** UTC midnight reset may be mid-day for some players; show a countdown and state it in the UI.
6. **Hosting choice:** GitHub Pages is simplest (data committed by the Action); Cloudflare Pages gives more headroom. Decide in Phase 4.

## 6. Decisions Needed From You

- Rounds per day: single question or 5 rounds with different stats?
- Are win rate / pick rate required for launch, or acceptable as a later phase?
- Frontend preference: Preact (suggested) vs. vanilla TS vs. React?
- Hosting preference and whether you already own a domain.

## 7. Suggested First Session

Phase 0 and the Data Dragon part of Phase 1: scaffold, then print one champion's stats from live data to confirm the source works.
