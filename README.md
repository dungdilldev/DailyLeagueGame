# DailyLeague

A daily League of Legends quiz: five rounds, four champions each, pick the one with the highest stat. A new puzzle every day (00:00 UTC).

Champion release dates come from the [League of Legends Wiki](https://wiki.leagueoflegends.com/) (CC BY-SA 3.0). Not endorsed by Riot Games. See the footer of the site for the full disclaimer.

## Run locally

```
npm install
npm run dev          # http://localhost:5173
```

All questions the game can ask: [docs/QUESTIONS.md](docs/QUESTIONS.md).
How to test locally (play, reset progress, run checks): [docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md).
All commands are also listed in [CLAUDE.md](CLAUDE.md).

## Deploying to GitHub Pages (one-time setup)

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. In **Settings > Actions > General > Workflow permissions** choose **Read and write permissions**
   (the daily job commits new puzzles). If `main` has branch protection, allow GitHub Actions to push to it.
4. Open the **Actions** tab, run **Update data and deploy** once with **Run workflow**, then check the
   site at `https://<your-user>.github.io/<repository>/`.

After that it runs by itself every day at 00:30 UTC, and on every push to `main`.

## How the daily automation works

- The daily puzzle is generated in the browser from the date (UTC), using the champion and item data in
  `public/data/champions.json` and `public/data/items.json` and the questions in `data/questions.json`. There are no puzzle files; the answers can be worked out by anyone
  who reads the code, which is fine for a casual game.
- `Update data and deploy` (scheduled, daily): fetches fresh champion data from Riot's Data Dragon and
  the LoL Wiki. If nothing changed, it stops. If something changed (a new patch or champion), it runs
  the full test suite, which generates a year of puzzles from the new data and checks every one, then
  commits the data and deploys.
- New data takes effect from the next UTC day, so a puzzle never changes under someone who is
  already playing it.
- If anything fails (Riot data changes shape, a test breaks), nothing is committed or deployed and
  the previous site stays live. GitHub emails the repository owner about failed runs.
- `CI` runs checks and browser smoke tests on every pull request and push to `main`.
