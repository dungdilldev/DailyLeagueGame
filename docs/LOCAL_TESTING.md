# Testing Summoner's Quiz locally

Everything below runs from the project folder. You need Node 22 or newer (`node -v`).

## First time

```
npm install
npx playwright install chromium     # only needed for the browser tests (npm run test:e2e)
```

## Game modes

The buttons at the top switch between the mixed puzzle and one category. Open
http://localhost:5173/?category=lore (or `stats`, `esports`) to go straight to one. Each
mode saves its own progress, so to replay one mode only, clear its key in the browser's local
storage: `dailyleague:v1` is the mixed mode, `dailyleague:v1:lore` and so on are the others.

## Play the game

```
npm run dev
```

Open http://localhost:5173/ . The page reloads when you edit code. Stop with `Ctrl+C`.

| Goal                       | Command or URL                                                     |
| -------------------------- | ------------------------------------------------------------------ |
| Play on your phone         | `npm run dev -- --host`, then open the "Network" address it prints |
| Try the production build   | `npm run build`, then `npm run preview` (http://localhost:4173/)   |
| Play an earlier day        | Use the "Previous day" button, or open `/?date=YYYY-MM-DD`         |
| Play again after finishing | Reset progress (below)                                             |

Only today and the previous 7 days can be opened. Any other date in the address falls back to today.
Days played after their own date do not count towards the streak.

### Endless mode (testing every question)

Open http://localhost:5173/?mode=endless, or use the "Endless mode (for testing)" link under the daily puzzle. It shows random questions one after another with no end. Nothing is saved and nothing affects your streak.

- **Coverage table** at the bottom lists every question with how often it was shown and answered correctly. Questions not seen yet are red, so you can see at a glance whether everything is represented.
- **Question** and **Difficulty** menus force one question and/or one difficulty. If a question cannot be built at that difficulty (movement speed in the easiest round, for example) the page says so.
- **Skip question** shows the next one without answering. **New seed** starts over with a fresh random sequence and clears the table.
- **Seed:** the same seed always gives the same sequence of questions. It is kept in the address (`?mode=endless&seed=abc123`), so reloading repeats it and you can share a link to reproduce a problem.
- It uses the newest data even if that only starts tomorrow, so new questions can be checked early.

### Reset your progress

Progress and streak live in your browser. In the browser console (F12) run:

```js
localStorage.removeItem('dailyleague:v1');
location.reload();
```

### What you should see

- Today's puzzle: 5 rounds, each with 4 champions and a question. Rounds get harder: the gap between
  the best and second-best champion shrinks every round.
- After each answer, the real values of all four champions are shown.
- After round 5: your score, streak, a share button and a countdown to the next puzzle (00:00 UTC).
- The same date always gives the same puzzle, on any device.

## Automated checks

| What                                    | Command                                   |
| --------------------------------------- | ----------------------------------------- |
| Everything except browser tests         | `npm run check`                           |
| Unit and component tests only           | `npm test`                                |
| Unit tests, re-run on every file change | `npm run test:watch`                      |
| Browser tests (desktop + phone size)    | `npm run test:e2e`                        |
| Type errors                             | `npm run typecheck`                       |
| Code style problems                     | `npm run lint`                            |
| Formatting (fix / check only)           | `npm run format` / `npm run format:check` |

`npm run check` runs type check, lint, format check and the unit tests: the same things the CI
pipeline runs, minus the browser tests. Run `npm run check` and `npm run test:e2e` before pushing.

The browser tests build the site themselves and start a preview server on port 4173. They save
screenshots to `test-results/` (round, reveal, results and previous-day screens), which is handy for
a quick visual check on desktop and phone sizes.

## Refresh the champion data

```
npm run data:refresh
```

Fetches the latest champion data from Riot's Data Dragon and the LoL Wiki and updates
`public/data/champions.json` and `public/data/items.json`. It needs an internet connection. If the
data of a file did not change, that file stays the same. If it did change, the new data becomes a snapshot that starts tomorrow (UTC) and the
previous one is kept, so today's puzzle does not change.

Afterwards run `npm test`: it generates a year of puzzles from the data and checks every one.

## Troubleshooting

| Problem                                     | Fix                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Executable doesn't exist` in browser tests | Run `npx playwright install chromium`                                                          |
| Port 5173 or 4173 already in use            | Stop the other dev server, or use `npm run dev -- --port 5200`                                 |
| Page says "Something went wrong loading"    | `public/data/champions.json` or `items.json` is missing or invalid: run `npm run data:refresh` |
| Champion icons are blank                    | They load from Riot's CDN, so check your internet connection                                   |
| Data refresh fails on the wiki step         | The wiki may be down or changed its format; the error says which. Retry later                  |
| You see an already-finished day             | Reset your progress (see above)                                                                |

## What cannot be tested locally

The GitHub workflows (`.github/workflows`). To try them, push to GitHub and use **Actions > Update
data and deploy > Run workflow**. Use "Run workflow" rather than "Re-run jobs" on an old run.
