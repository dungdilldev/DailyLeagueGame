1. The start page and every game page load Zod for nothing (about 30 kB gzipped). The shared Countdown-*.js chunk is 100 kB, and most of it is Zod plus all the data-file schemas. Two imports pull it in:

progressStore.ts uses Zod to check a three-field record from localStorage.
categoryLabels.ts imports QuestionCategorySchema from schema.ts, which brings in every data schema.
Fix: a plain QUESTION_CATEGORIES list with the schema built from it, and a small hand-written check (or zod/mini) for saved progress. That cuts roughly three quarters of the JavaScript on the start page.

2. Shared links have no preview. The share text links to the mode page (trivia.html, …), which has no Open Graph tags; only the start page has them, and no page has an image. Discord or WhatsApp then shows a bare link. Adding og: tags to the game pages and one static share image (already on the plan's Phase 6 list) is cheap and helps the posts you're planning for traffic.

3. Mixed mode is mostly stats. Mixed draws evenly over slots, and stats has 29 slots against 5 for esports. A Mixed day now has about 1.9 stats rounds and 0.36 esports rounds. Drawing a category first and then a slot within it would give each category a fair share. That's a generator change, so every puzzle moves once.

4. Champions repeat on consecutive days. This is still an open item in Phase 2: each day is drawn on its own. It's lower value, because a day only shows about 20 options.

5. Code tidy-ups against your own rules:

package.json uses ^ ranges, but CLAUDE.md says to pin versions. The lockfile pins in practice, but the stated rule isn't followed.
Three files are over the ~200-line guideline: schema.ts at 392 lines, EndlessScreen.tsx at 236 and refresh.ts at 217. Splitting schema.ts fits naturally with item 1.
6. Stale notes in IMPLEMENTATION_PLAN.md:

Phase 3 "Fallback to the latest available puzzle" is still open, but puzzleDays.ts already plays the newest puzzle with a note.
Phase 5c5's "Open: questions about pro play" was done in later phases.
Phase 5c11 lists Canyon, ShowMaker, TheShy and Bang as missing players, but they're all in now; only Wolf is missing.
7. Content risk to keep in mind: 87 of the 102 players in data/players.json are still unverified. A missing team or title turns a wrong option into a right one, so checking the most-asked players (T1, Worlds winners) against Leaguepedia is the most valuable content check.

I'd start with 1 and 2. Item 1 is a contained change with a measurable gain; item 2 needs you to provide or approve a share image. Tell me which ones to do.