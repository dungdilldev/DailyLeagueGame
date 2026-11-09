# Summoner's Quiz - Implementation Plan

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
GitHub Actions (cron, 12:00 and 22:00 UTC)
   |
   v
pipeline/sources  -> fetch Data Dragon + LoL Wiki
pipeline/validate -> sanity checks, fail loudly
pipeline/snapshots-> new data becomes a snapshot effective from the next UTC day
   |
   v
public/data/champions.json + items.json + abilities.json  (stats + snapshots; committed only when data changes)
data/questions/*.json  (hand-edited question templates, one file per category, bundled into the app)
   |
   v
Static site (Vite build, every run): for each game page, pick each file's snapshot for today and
         tomorrow (UTC), generate both days' puzzles with the date-seeded generator
         (src/game/generate), put round 1 into the HTML and both puzzles in as JSON -> GitHub Pages
   |
   v
Browser: pick today's puzzle from the page by UTC date, play, store result in localStorage
```

**Why static + generate at build time** (in the browser until 2026-11-05)**:** zero hosting cost, no server, no per-day files in the repo, and the game pages carry their questions as text. The generator is deterministic (seed = UTC date), so every player gets the same puzzle. Snapshots with an `effectiveFrom` date keep a day's puzzle stable when data changes. Trade-off: answers are inspectable by anyone (a server would be needed to hide them).

**Self-healing:** if a refresh fails, the site is still rebuilt from the last good data. If a build fails, the pages already carry tomorrow's puzzle; after that they show their newest puzzle with a note.

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

### Phase 5c3 - Pick questions (done)

- [x] Questions without a stat, answered from explicit `correct` / `wrong` lists (`buildPickRound`); first example: "Which of these champions is a yordle?"
- [x] Round has optional `format` / empty `values` for these; the right card is tagged "Correct" instead of "Highest"
- [x] Question templates reject unknown keys
- [x] Required `category` (`stats` / `lore` / `esports`) and `difficulty` (`easy` / `medium` / `hard` / `variable`) per question; rounds are tiered easy, easy, medium, hard, hard and a fixed difficulty is only asked in its tier

### Phase 5c4 - Lore questions (done)

- [x] Category `lore`; 12 pick questions: champions from each of 9 regions (Demacia, Noxus, Freljord, Ionia, Piltover, Zaun, Shadow Isles, Bilgewater, Mount Targon), yordles, Void creatures, Darkin
- Limit: options are still champions or items, so questions whose answers are not champions (e.g. "Which region is Jinx from?") need a new option kind.
- Lore lists are hand-written; the wiki is the source to check them against.

### Phase 5c5 - Esports questions (done)

- [x] Category `esports`; 2 pick questions about esports skins: T1 / SKT T1 (`medium`) and Worlds (`hard`)
- Lists were built from Data Dragon skin names (patch 16.20.1); every wrong option has no esports-line skin at all (Victorious, T1, Worlds, Dragonslayer, MSI).
- Open: questions about pro play itself (teams, players, tournament results) need a source we can check and, for teams or players, a new option kind.

### Phase 5c6 - Game modes (done)

- [x] Mode buttons at the top: Mixed (all questions, the original puzzle) and one per category; `?category=` in the address
- [x] The site opens on Stats instead of Mixed (owner, 2026-10-31); saved progress and seeds unchanged, so Mixed keeps its streak
- [x] Trivia first (owner, 2026-11-04): modes are shown in the order trivia, lore, stats, esports, mixed, and Trivia is the default (start page button, header and footer "Play", old `play.html` links); puzzles, seeds and saved progress unchanged
- [x] Each mode has its own seed, saved progress, streak and share text
- [x] Pools smaller than 5 questions give shorter days; empty tiers fall back to the nearest tier
- The `trivia` category (one marksman question) was removed again.

### Phase 5c7 - Endless mode is dev-only (done)

- [x] No link to the endless mode; `?mode=endless` only works in development builds and is removed from the production bundle
- [x] Its Playwright tests run against the dev server; a production test checks the address shows the normal game

### Phase 5c8 - Esports history questions (done)

- [x] `text` option subject: team names, players, cities and regions as plain cards (name = id, no icon, no data file)
- [x] 9 history questions: Worlds winners, finalists without a title, final cities, titles per region and player, Faker's nickname, T1 players, first champion, three in a row
- [x] Esports mode now has 11 questions, so a full 5-round day
- Facts checked against the Wikipedia Worlds results table up to the 2025 final. They go stale: re-check the esports lists after every Worlds (November). The 2026 final is in New York, and the pool should be refreshed after it.

### Phase 5c9 - More lore questions (done)

- [x] Clue questions (`clue: "title"`): "Which champion is known as ...?" built from the champion data
- [x] Regions rebuilt from the wiki region pages (Urgot moved from Noxus to Zaun, Mordekaiser dropped from the Shadow Isles, ambiguous distractors removed) and extended with Shurima, Ixtal and Bandle City
- [x] Events and groups: Noxian invasion of Ionia (negative question), the Ruination, Sentinels of Light, the Ascended; the Darkin list gained Zaahen
- Lore now has 20 questions.

### Phase 5c10 - Stats relative to release date (done)

- [x] New stat and question "most skins relative to their release date" (`skinsPerYear`)
- [x] "Most patch notes" became "most patch changes relative to their release date" (`patchesPerYear` replaces `patchCount`)
- [x] Age is measured up to the newest champion release in the data, not today, so values only change with the data; minimum age one year
- [x] `data:refresh` run: new champion snapshot effective 2026-10-18; today's puzzle keeps its old data (so the new stat questions first appear tomorrow)

### Phase 5c11 - Esports players file (done)

- [x] `data/players.json` with 102 players: the first 15 checked against Wikipedia, the other 87 filled from web search summaries and unverified (region = league of the best-known stretch; Taiwan, Vietnam, Latin America and Brazil were added as regions)
- Earlier: 15 well-known players (name, region, Worlds/MSI titles, teams, optional nickname), checked against their Wikipedia articles; schema in `src/data/playerSchema.ts`
- [x] Two player questions (`playerByTeam`, `teamByPlayer`, both `medium`), generated from the players; the file is bundled and validated at load and on `data:refresh`
- Adding the questions changes the puzzle for every date (see Generator changes move old puzzles); saved answers that no longer fit are dropped.
- [x] Winner questions: which team won Worlds (2011-2025) or MSI (2015-2026, none in 2020) in a given year; winners are written in the question, wrong options are winners of other years
- Open: players whose article was not found (Canyon, ShowMaker, TheShy, Bang, Wolf, ...) are not in yet; more players give more variety.

### Phase 5g2 - Endless mode by category (done)

- [x] Category dropdown in the endless mode: limits the random questions and the question list to that category; the coverage table is grouped by category with a seen count each

### Phase 5c12 - Esports questions from the player data (done)

- [x] Nickname question generated from the players (`playerByNickname`), replacing the hand-written one that only knew Faker
- [x] "Who played for T1" removed: the generated players-and-teams question covers it
- [x] T1 and Worlds skin questions merged into one esports-skin question (40 champions)

### Phase 5g3 - Question subcategories (done)

- [x] Optional `subcategory` on every question (schema validates the spelling); endless mode gets a Subcategory dropdown and groups its question list and coverage table by it; `continentsRunterra` is the first (`lore`, `geography`)
- The daily puzzle treats a subcategory as one slot (phase 5c13).

### Phase 5c13 - Lore geography, nations, city-states and events (done)

- [x] 193 new Lore questions in 21 subcategories, written from the League of Legends Wiki (Universe:Runeterra locations, Universe:Timeline and the linked location and event pages): `geography`, `nations`, `city-states` and 18 events
- [x] A subcategory is one slot in the daily puzzle (`orderBySlot`): at most one question per subcategory a day, so Lore has 50 more questions without taking over. In Mixed mode Lore is about 53% of rounds, Stats 37%, Esports 10%
- [x] Repaired `continentsRunterra` (it broke the data load); the wiki says Camavor's continent is "an eastern continent", so the question says that
- Not on the wiki: a "western continent" (the page names Valoran north, Shurima south, Camavor east, Arctic as the north pole), so there is no such question
- Open: nothing checks that a wrong option is unrelated to the event. Review lists when the wiki changes.

### Phase 5c14 - Ability questions (done)

Decisions (owner, 2026-10-24): the options are abilities (a new subject, like items), all numbers at max rank, four groups of questions.

- [x] Abilities as a third data file, `abilities.json` (655 abilities on patch 16.21.1), with its own snapshots; cards show "Ahri Q · Orb of Deception" with Data Dragon's spell icon
- [x] Source: each ability's wiki data template (`Template:Data <Champion>/<Slot>`), fetched in batches; the batched page fetch is shared with the patch history source (`leagueWikiPages.ts`)
- [x] 8 stat questions: base damage (basic abilities 178, ultimates 48), AP ratio (158), bonus AD ratio (62), total AD ratio (22), longest cooldown (basic 478, ultimates 166), mana cost (513)
- [x] Only unarguable values: one champion damage line per ability, no formula ratios, no cooldown for abilities with charges, mana-only costs, wiki and Data Dragon names must agree (see CLAUDE.md, Abilities)
- No health-ratio question: only Volibear W has a damage line that scales with the champion's own health. Range was looked at and dropped (cast range, effect range and dash distance are mixed in one field, plus "Global").
- No `subcategory`, like the item questions, so each ability question is its own slot; with 8 more stat questions, items and abilities each come up on roughly half of the days.
- Adding the questions changes the puzzle for every date, including today (see Generator changes move old puzzles).

### Phase 5c15 - Esports variety (done)

Decisions (owner, 2026-10-24): all four idea groups, and memorable moments in mixed formats.

- [x] "By year" question kind (renamed from winners: `byYear: [{year, answer}]`, `buildYearRound`); new: Worlds runners-up (2011-2025), Finals MVP (2014-2025; sources disagree before that), final city (2011-2025)
- [x] Fixed the Worlds winners list: it named 2013-2016 "SK Telecom T1" and 2023-2025 "T1", so "Who won in 2013?" could offer T1 as a wrong option. Every `byYear` list now uses one name per organisation
- [x] Player questions: has won Worlds / MSI, has never won Worlds, made their name in a region (a wrong option never played for a team of that region's players), best known in a role (new required `role` field for all 102 players, unverified like the other web-sourced data; players known in two roles are excluded)
- [x] Esports skins generated from Data Dragon skin names (`esportsSkinLines` on champions, SKT T1 and T1 merged, yearly Worlds skins included); replaces the hand-built esports skin list. New champion snapshot from 2026-10-25, so the question first appears that day
- [x] "Which team does this logo belong to?": a logo shown with the question (`Round.clue`), plain names as options, 40 hand-picked teams with distinct logos
- [x] 11 memorable moments (`subcategory: moments`): who, which team, which champion, which year
- Mixed mode is now about 38% stats, 43% lore, 19% esports (was about 10% esports). Not done: region-specific moments and older or regional moments (the owner can add favourites; every fact needs a source)

### Phase 5d - Previous days (done, removed again in Phase 9)

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
- [x] Analytics: Cloudflare Web Analytics (cookieless, page views only, no consent needed), on every page via `src/pages/partials/analytics.html`
- [ ] OG share image
- [ ] Archive of past puzzles
- [ ] "Report a problem" button on each round. Deferred until the site has a server of its own: no third-party form service (decided by the owner); a `mailto:` link with the question, options and date prefilled is the no-server fallback

### Phase 7 - Information pages (done, groundwork for ads)

- [x] Static `how-to-play.html`, `about.html`, `privacy.html` (real text for crawlers, not JS-rendered), linked from both footers
- [x] Shared header/footer/contact through `<!--include:name-->` partials; multi-page Vite build
- [x] Ads follow in Phase 8

### Phase 7b - One question file per category (done)

Decision (owner, 2026-10-31): `data/questions.json` had grown to ~4,500 lines with the categories interleaved.

- [x] Split into `data/questions/stats.json`, `lore.json` and `esports.json`; the file decides a question's category (entries no longer have a `category` key)
- [x] `src/data/questionFiles.ts` validates each file, adds the category and checks ids across files; loader, refresh and tests use it
- Category-mode puzzles are unchanged (each file kept its order); the mixed puzzle changed once for every date because the combined order changed.

### Phase 7c - Trivia category (done)

Decision (owner, 2026-10-31): a fourth category, "Trivia", about the game itself and its development; one subcategory per topic.

- [x] `trivia` category: `data/questions/trivia.json`, mode button, start page card (the mixed card now spans its row), how-to-play and about text
- [x] 43 questions in 16 subcategories (scrapped champions, cancelled features, removed modes, spells and items, original champions, visual and gameplay updates, voice lines, names and references, music bands, Ultimate skins, spin-offs, Summoner's Rift, ranked history, April Fools, Riot Games), checked against the LoL Wiki and Data Dragon
- [x] Mode buttons tighten on narrow screens so five fit
- Stats, lore and esports puzzles are unchanged; the mixed puzzle changes for every date (new questions).

### Phase 7d - Redesign (done)

Decision (owner, 2026-11-02): new look from the owner's design canvas (landing page and play page). Landing first, the game page as its own change. Fonts self-hosted (Inter and Spectral, Latin subset, OFL) instead of Google Fonts, so no third party is contacted.

- [x] Start page: hero with date badge, two calls to action and countdown; an answerable sample round ("Which of these champions is a yordle?"); three steps; five mode cards with icons
- [x] Shared full-width header (name, How to play, Categories, About, Play) and footer for the start page and the info pages; `privacy.html` font text updated
- [x] Mode cards on the first screen (owner, 2026-11-09): the start page hero is the headline followed directly by the five mode cards (a compact row per mode on phones, tiles on desktop), then the countdown; the sample round and the three steps moved below. The "Play today's puzzle" hero button was dropped (the cards and the header "Play" do its job). An e2e test checks every card is in the first viewport on desktop and phone
- [x] Game page (`play.html`): category pills with a check on modes finished that day, day nav with arrows, wide round panel with four cards in a row (two on a phone), hint and Next button in one row, results panel with "Correct"/"Wrong" per round and a "Play <next unfinished mode> next" button
- [x] The game uses the shared header and footer partials; `ui/Footer.tsx` is gone and its League of Legends Wiki attribution moved into the shared footer (now on every page)
- The "Played today" mark shows no score: the start page would have to build every mode's puzzle to know it

### Phase 8 - Ads with Google AdSense (in progress)

Goal: one or two small, unobtrusive ads that never get in the way of the game and never load before the visitor has agreed, where the law asks for it. The owner already has a domain.

**Decisions (confirm before building)**

- [x] **Riot policy:** the owner checked Riot's Legal Jibber Jabber and ads are allowed (confirmed by the owner, 2026-10-21).
- [x] **Placement:** one banner on the game pages (`play.html` until 2026-11-04, now one page per mode) between the game and the footer, below the support link (decided by the owner); never between the answer cards or next to the Next-round button (accidental clicks break AdSense policy). No ads in the dev-only endless mode.
- [ ] **Operator identity (Germany):** the owner lives in Germany, so a site with ads needs an Impressum (§ 5 DDG): real name and a postal address that can receive legal documents (no P.O. box, no handle only), plus an email address. Decide which address to publish, and the email (preferably `contact@<domain>` forwarding to the owner's inbox). Add `impressum.html` to the footers and `PAGES`, and name the operator in `privacy.html` (the GitHub issues link is not enough). Sources are in the chat answer of 2026-10-21; have a lawyer or a service such as eRecht24 check the final text.

**A. Domain and hosting**

- [x] Point the domain at the host (GitHub Pages custom domain: `public/CNAME` plus DNS records, enable HTTPS)
- [x] Check that `base: './'`, the page links and the e2e tests still work on the custom domain
- [x] Redirect or retire the old `github.io` address so the domain is the single canonical site (add `<link rel="canonical">` to every page)

**B. Get approved (can run in parallel with C)**

- [x] Content check before applying: how-to-play, about and privacy pages are live and linked (done in Phase 7); no broken links; a visible contact address
- [x] Create the AdSense account, add the site, add the verification snippet/`ads.txt` as instructed
- [x] Wait for review. **Rejected 2026-10-31:** "ads on screens without publisher content" and "low value content". The crawler saw `/` as an empty JavaScript shell that turns into a game screen (a "behavioural" screen), plus three short text pages, and no `robots.txt` or sitemap.
- [x] Fix, step 1: static start page `index.html` (headline, live countdown, one short card per mode with "played today" marks; the owner wanted it compact, so the mode descriptions, data sources and FAQ were moved to `how-to-play.html`, which is now the main text page), the game moved to `play.html` (old `/?category=` / `?date=` / `?mode=` links redirect), `robots.txt`, `sitemap.xml`, `<link rel="canonical">` on every page
- [ ] Owner: deploy, add the site to Google Search Console, submit the sitemap, check that `/` is indexed with its text. Build some real traffic over a few weeks (Google also judges "genuine user interest"), then request review
- [x] **Ads on the game page only** (owner, 2026-11-03, replacing the earlier idea of ads on the start and info pages only): `play.html` is the only page that may show ads; the start page and the info pages never load ad code. Risk: the rejection named "ads on screens without publisher content", and the game screen is the kind of screen that meant; if Google rejects again for that reason, revisit this
- [x] Fix, step 2 (2026-11-04, after looking at how Champdle and LoLdle are built): **one page per game mode** instead of one empty `play.html`. `stats.html`, `lore.html`, `esports.html`, `trivia.html` and `mixed.html` each have their own title, meta description, canonical address and a static heading with one line on what the mode asks, all in the HTML a crawler reads; the app reads the page's mode from `#app[data-mode]`. The mode pills and the results' "Play X next" button are links between the pages (an earlier day is kept). `play.html` only redirects old links (`?category=X` to `X.html`, the rest of the address kept) and is `noindex`; the sitemap lists the five pages. Ads are on all five pages (they are the game page, split up); `privacy.html` says "game pages"
- [x] Answer texts, step 1 (2026-11-04): an optional `answer` on every question, shown after the player picks; five lore examples checked on the wiki
- [x] Answer texts, step 2 (2026-11-04): 250 texts, written from the wiki pages the questions come from (the 18 Universe event pages, the region and place pages, Unreleased Content, the map, mode, rank, item and Riot pages): 209 of 213 lore, 37 of 43 trivia, 4 esports moments. Left out where nothing worth saying could be sourced (Low Piltover, Upper Piltover, Entresol, removed spells and items, the original 17, Teemo's line, Ultimate skins), the clue question, all stat questions (no templated text) and the generated esports questions. Most esports moments and the Worlds history questions have none on purpose: any fact worth adding (a final's opponent, a year, a city) is the answer to another esports question that can come up the same day. Every text was also checked for names that answer another question of a different slot (`First Lands`, `Great City`, `Ixaocan`, places of a nation...) and reworded
- [ ] Later, not decided: pages for past days with their answers (and answer texts)
- [ ] If rejected again: more original pages, e.g. reference pages generated from the data (stat rankings, lore regions and events, Worlds history) and a few hand-written guides

**C. Consent and privacy (required for EEA, UK and Switzerland visitors)**

- [x] Site logo (owner's choice 2026-11-03: "Emote coin", a gold question mark on a navy coin, from the design canvas): header mark, `public/favicon.svg` on every page, and the 600x120 consent-message logo in `docs/brand/` (dark text for Google's default white message, light text for a dark one)
- [x] Turn on Google's consent message (Privacy & messaging in AdSense, a certified consent platform): message created by the owner 2026-11-03. Google's ad script would bring the message along, but it may only load after consent, so `src/ads/googleConsent.ts` loads the message on its own first (Google's Funding Choices tag `fundingchoicesmessages.google.com/i/<publisher>?ers=1` plus the hidden `googlefcPresent` frame), on `play.html` only and only when ads are switched on. The ad script loads after TCF purpose 1 consent, or right away where no consent is needed
- [x] "Privacy and cookie settings" link (Google's wording) to reopen the choice: at the bottom of `play.html` instead of the shared footer, because only the game page loads the consent message (`PrivacySettingsLink.tsx`, calls `googlefc.showRevocationMessage` through Google's queue). Shown only where the consent rules apply (`gdprApplies`), as in Google's example, and still shown after a "no"
- [x] Update `privacy.html` (2026-11-03): ads on the game page only, Google as provider, consent first in the EEA/UK/CH, what Google receives, legal basis, how to withdraw (the link, My Ad Center, `youronlinechoices`), GDPR rights and complaint; "no advertising cookies" removed. Written as if ads were live, because AdSense review expects the disclosure; `about.html` and `how-to-play.html` needed no change. **Still missing: the controller's name and address** (comes with the Impressum above); have the text checked (eRecht24 or a lawyer) before ads go live

**D. Code**

- [x] `public/ads.txt` with the publisher line AdSense gives
- [x] `src/ads/` (pure logic, unit-tested): the publisher and slot ids as named constants, and `shouldLoadAds(consent, isDevBuild)`; ads are switched on per build with `VITE_ADS_ENABLED=true` and `VITE_AD_SLOT_ID` (both unset, so off, until approval and the consent message)
- [x] `src/ui/AdSlot.tsx`: reserves a fixed height so the layout never jumps, loads the AdSense script once and only when allowed, renders nothing if the script is blocked or fails (an ad blocker must not break or blank the game); a "Advertisement" label above it
- [x] Only the game shows the slot (`App.tsx`, not in the endless mode); an ESLint `no-restricted-imports` rule keeps `src/ads` and `AdSlot` out of `src/pages`, so the start and info pages cannot load ad code
- [ ] Content-Security-Policy / host headers if any are set: allow Google's script, frame and image domains
- [x] `import.meta.env.DEV` builds never load ads, so local testing and the endless mode stay clean

**E. Tests**

- [x] Unit: consent decision, ad config, slot renders nothing without consent
- [x] Playwright (`e2e/ads.spec.ts`, against a second build with ads on; script stubbed or blocked via `page.route`): the full-day game test passes with ads blocked and with consent declined; no console errors; no horizontal scroll on mobile; the slot does not move the answer buttons; the start page and the info pages never request the ad script, even with consent
- [ ] Manual after launch: use AdSense test mode / `adtest=on` before real traffic, check Lighthouse (layout shift and speed) before and after. Check that the consent message shows from the EU (VPN) and that a visitor outside it gets ads without a message: our code waits for `__tcfapi` to report `gdprApplies: false`, which the docs do not promise for every region; if no ad loads there, read consent from `googlefc.callbackQueue` instead

**F. Launch and after**

- [ ] Deploy, verify `ads.txt` is reachable at `/ads.txt`, wait for ads to start serving
- [ ] Monitor AdSense policy centre and the earnings/RPM; watch page speed and the player drop-off
- [ ] If ads hurt play, move the banner or remove it

**Done when:** approved ads show on the live domain only after consent where required, the game works identically with ads blocked, the privacy policy matches what the site does, and `npm run check` and the e2e tests pass.

### Phase 9 - Built daily, today only, local images (in progress)

Goal (owner, 2026-11-05, after looking at how Champdle and LoLdle are built): a simpler, faster site whose game pages carry the day's questions in their HTML. The puzzle is generated at build time, the site is rebuilt every day, only today can be played and every image is served from our own host.

**Decisions (owner, 2026-11-05)**

- [x] Midnight handover: every game page holds **today's and tomorrow's** puzzle; the client picks by UTC date and, if neither matches (a missed build), shows the newer one with a short note. Accepted: tomorrow's answers are in the page source a day early (casual game, answers were never secret)
- [x] The production client gets the puzzle only: no data files, question files, player file, schemas or generator. Only the dev-only endless mode still loads them (lazy import)
- [x] No "yesterday's answers" page for now, no puzzle number

**Order:** 1, then 2, then 3 and 4 together (built-in puzzles without a daily build would go stale at midnight).

**1. Today only (remove previous days)**

- [x] Remove `src/game/archive.ts`, `DayNav`, the `?date=` handling in `App.tsx`, `ModeNav`'s `archiveDate`, the date kept by `modePageHref` and `play.html`, and the "Earlier puzzle" result note
- [x] Remove the `late` flag from new saves; old saves (with `late` or an old date) must still load, and old days never count for the streak
- [x] A `?date=` link opens today and the parameter is removed from the address
- [x] Snapshots: keep only the snapshot in effect today plus any upcoming one (`pruneSnapshots`)
- [x] Tests (unit and e2e), `how-to-play.html` (earlier days paragraph and meta description), CLAUDE.md (Archive, Snapshots, Game modes), `docs/LOCAL_TESTING.md`. The day buttons are gone without a replacement: the game no longer shows the date

**2. Local images**

- [x] Champion, item and ability icons downloaded from Data Dragon by `data:refresh` into `public/images/{champions,items,abilities}/` as PNG (no image library); only when the Data Dragon version changes or a file is missing; files of entities no longer in the data are deleted; a failed download fails the run
- [x] The data files hold local paths, joined with `BASE_URL` in the client (one new snapshot, harmless)
- [x] Region and group crests downloaded from the LoL Wiki (like the esports images) instead of hotlinked
- [x] Test: every entity and every crest has a file; `e2e/images.spec.ts` plays each mode on the newest data and fails on any image from another host
- [x] `deploy.yml` commits `public/images/icons` with the data (it only committed `public/data`)
- Done 2026-11-05: 941 icons (12 MB) and 22 crests. Today's snapshot still names Data Dragon (a snapshot in effect is never edited); from 2026-11-06 every image is local
- [x] `privacy.html` (the browser no longer contacts Riot or the wiki), CLAUDE.md (Riot legal, Region crests, Commands), `about.html` if needed

**3. Puzzle built into the HTML**

- [x] Build step (`prerender-puzzles` in `vite.config.ts`, `src/prerender/`; `PUZZLE_DATE` env, default today in UTC; also on the dev server, on every page load): for each mode page, today's and tomorrow's puzzle from the existing generator. Round 1 of today's is rendered into `#app` (question, the four option names and icons, the mode links: what a first visit shows), both puzzles are embedded as JSON with only what the cards need; answers and answer texts only in the JSON. Only round 1, not all five questions: the other four are not on screen, and hidden text is what search engines penalise
- [x] The app replaces the built-in markup (render, not hydrate: a returning player's state differs anyway), picks the day by UTC date, falls back to the newest puzzle with a note; an inline script hides round 1 before it is drawn when the app will show something else
- [x] Production bundle without data, question and player files and generator (zod stays, for the saved progress); the endless mode loads them with a dynamic import in dev only
- [x] Landing page sample round: nothing to do, it is hand-written HTML already
- [x] Tests: `buildPuzzleDays`, `pickPuzzleDay`, `renderGamePage` (page holds round 1, embedded puzzles equal `createDailyPuzzle`, JSON cannot close its script), `DailyPage`, `readPuzzleDays`; e2e (`e2e/days.spec.ts`): the switch at midnight, a missed build, no flash for a returning player, the first question without JavaScript; the e2e build uses the default date (today) and the tests set `page.clock` from it
- [x] CLAUDE.md, README, `docs/LOCAL_TESTING.md`, section 2 of this plan
- New dev dependency: `preact-render-to-string` (pinned 6.8.1), from the Preact team, used only by the build

**4. Daily rebuild**

- [x] `deploy.yml`: builds and deploys on every run, at 12:00 and 22:00 UTC
- [x] A failed data refresh no longer blocks the build: it builds from the last committed data; the unit tests gate the deploy
- [x] After deploy: the live `trivia.html` must carry today's puzzle (retried for 10 minutes, past GitHub's CDN cache)
- [ ] Failure notification beyond GitHub's email (Phase 4 open item): needs a choice of service (e.g. a Discord webhook or ntfy), not decided
- [x] Known: GitHub turns off scheduled workflows of public repos after 60 days without activity; data commits every patch should keep it active
- [ ] Owner: watch the first scheduled runs on GitHub (both crons, the live check)

**Done when:** the live site works a full week with no manual action, across UTC midnight, with no request to a third-party image host, and `npm run check` and the e2e tests pass.

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

### Note for Later

Before you reapply:

Deploy, add the site to Google Search Console and submit https://summonersquiz.com/sitemap.xml. Then check that / shows up indexed with its text.
Google also judges whether real people use the site, so give it a few weeks of traffic (Reddit, Discord) before you request a review.
Ads go on the game pages only (owner, 2026-11-03; one page per mode since 2026-11-04), not on the start page or the info pages. If the next review is rejected again for "ads on screens without publisher content", this is the first thing to revisit.
