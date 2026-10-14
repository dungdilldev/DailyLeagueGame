# DailyLeague

A daily League of Legends quiz: five rounds, four champions each, pick the one with the highest stat. A new puzzle every day (00:00 UTC).

Not endorsed by Riot Games. See the footer of the site for the full disclaimer.

## Run locally

```
npm install
npm run dev          # http://localhost:5173
```

Other commands (tests, data pipeline, e2e) are listed in [CLAUDE.md](CLAUDE.md).

## Deploying to GitHub Pages (one-time setup)

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. In **Settings > Actions > General > Workflow permissions** choose **Read and write permissions**
   (the daily job commits new puzzles). If `main` has branch protection, allow GitHub Actions to push to it.
4. Open the **Actions** tab, run **Update data and deploy** once with **Run workflow**, then check the
   site at `https://<your-user>.github.io/<repository>/`.

After that it runs by itself every day at 00:30 UTC, and on every push to `main`.

## How the daily automation works

- `Update data and deploy` (scheduled): refreshes champion data from Riot's Data Dragon, generates
  puzzles for the next 30 days (existing days are never changed), runs the full test suite, commits
  the new files to `main`, then builds and deploys the site.
- If anything fails (Riot data changes shape, a test breaks), nothing is committed or deployed and
  the previous site stays live. GitHub emails the repository owner about failed runs.
- Puzzles are generated 30 days ahead, so a broken refresh has roughly a month before players notice.
- `CI` runs checks and browser smoke tests on every pull request and push to `main`.
