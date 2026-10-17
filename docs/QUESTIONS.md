# Questions in DailyLeague

Every question the game can ask, with where the numbers come from and what to know about each one.

Figures were taken from the game data for patch **16.20.1** (173 champions, 113 items) and from a
simulation of two years of daily puzzles. They change a little with every patch.

## How a day works

- A day has **5 rounds**. Each round asks one question and shows **4 options** (champions or items).
- The right answer is always the option with the **highest** value. Ties are never used: the four
  values in a round are all different.
- **A round is about champions only or items only**, never a mix.
- A question is asked **at most once per day**, and no champion or item appears twice in a day.
- Rounds get harder. The gap between the best and second-best option shrinks each round:

| Round | Gap between 1st and 2nd | Feel                           |
| ----- | ----------------------- | ------------------------------ |
| 1     | 30% or more             | Clear winner                   |
| 2     | 18% to 30%              | Fairly clear                   |
| 3     | 10% to 18%              | Needs some knowledge           |
| 4     | 5% to 10%               | Close                          |
| 5     | 2% to 5%                | Very close, often a near guess |

The gap is `(best - second) / best`. A question can only appear in a round if the real values allow
a gap of that size, which is why some questions never show up in the easy or hard rounds (see
[Which round a question appears in](#which-round-a-question-appears-in)).

## All 20 questions

12 about champions, 8 about items. On average a day has about 3 champion rounds and 2 item rounds
(36% of all rounds are about items).

| #   | Question                                                                        | About    | Shown as   | Source      |
| --- | ------------------------------------------------------------------------------- | -------- | ---------- | ----------- |
| 1   | Which champion has the most skins?                                              | Champion | Number     | Data Dragon |
| 2   | Which champion was released most recently?                                      | Champion | Date       | LoL Wiki    |
| 3   | Which champion has the highest base health?                                     | Champion | Number     | Data Dragon |
| 4   | Which champion has the highest health gained per level?                         | Champion | Number     | Data Dragon |
| 5   | Which champion has the highest base health regeneration?                        | Champion | Number     | Data Dragon |
| 6   | Which champion has the highest base armor?                                      | Champion | Number     | Data Dragon |
| 7   | Which champion has the highest base magic resistance?                           | Champion | Number     | Data Dragon |
| 8   | Which champion has the highest base attack damage?                              | Champion | Number     | Data Dragon |
| 9   | Which champion has the highest base attack speed?                               | Champion | Number     | Data Dragon |
| 10  | Which champion has the highest attack range?                                    | Champion | Number     | Data Dragon |
| 11  | Which champion has the highest movement speed?                                  | Champion | Number     | Data Dragon |
| 12  | Which champion has appeared in the most patch notes?                            | Champion | Number     | LoL Wiki    |
| 13  | Which item costs the most gold?                                                 | Item     | Number     | Data Dragon |
| 14  | Which item is the most gold efficient from its stats alone (ignoring passives)? | Item     | Percentage | LoL Wiki    |
| 15  | Which item gives the most attack damage?                                        | Item     | Number     | LoL Wiki    |
| 16  | Which item gives the most ability power?                                        | Item     | Number     | LoL Wiki    |
| 17  | Which item gives the most health?                                               | Item     | Number     | LoL Wiki    |
| 18  | Which item gives the most armor?                                                | Item     | Number     | LoL Wiki    |
| 19  | Which item gives the most magic resistance?                                     | Item     | Number     | LoL Wiki    |
| 20  | Which item gives the most ability haste?                                        | Item     | Number     | LoL Wiki    |

Each question comes up roughly once every 4 days (about 0.25 times a day). Ability haste is rarer.

## Champion questions

All 173 champions have a value for every champion question.

| #   | What is compared                               | Lowest                | Highest             | Distinct values |
| --- | ---------------------------------------------- | --------------------- | ------------------- | --------------- |
| 1   | Number of skins                                | Locke: 1              | Miss Fortune: 22    | 22              |
| 2   | Release date                                   | Alistar: Feb 21, 2009 | Locke: Jun 24, 2026 | 144             |
| 3   | Base health (level 1)                          | Kled: 410             | Tryndamere: 696     | 50              |
| 4   | Health gained per level                        | Yuumi: 69             | Galio: 126          | 36              |
| 5   | Base health regeneration (per 5 seconds)       | Briar: 0              | Vi: 10              | 20              |
| 6   | Base armor (level 1)                           | Cassiopeia: 18        | Leona: 43           | 24              |
| 7   | Base magic resistance (level 1)                | Kayle: 22             | Akali: 37           | 11              |
| 8   | Base attack damage (level 1)                   | Orianna: 44           | Renekton: 69        | 25              |
| 9   | Base attack speed                              | Graves: 0.475         | Maokai: 0.8         | 34              |
| 10  | Attack range                                   | Akali: 125            | Caitlyn: 650        | 19              |
| 11  | Movement speed                                 | Rell: 315             | Master Yi: 355      | 8               |
| 12  | Number of patches the champion has an entry in | K'Sante: 2            | Mordekaiser: 119    | 82              |

Things to know:

- **#1 Skins:** counts distinct skins. The default skin is not counted, and neither are chromas or
  prestige editions that Data Dragon lists as "Skin Name (Variant)".
- **#2 Release date:** the more recent date wins. Stored internally as days since 2009-01-01.
- **#3 to #11:** the champion's base stats from Data Dragon, before items and level-ups. "Health
  gained per level" is the growth number, not the total.
- **#12 Patch notes:** counts every patch in the champion's wiki "Patch history" page. That includes
  bug fixes, hotfixes and visual updates, not only balance changes, which is why the question says
  "patch notes". K'Sante's wiki page is damaged at the source, so he shows only 2.

## Item questions

The item pool is the **113 completed items** a player would build on Summoner's Rift: legendary
items and boots. Components (such as Long Sword), starter items, consumables, trinkets and items
from other game modes are not used.

| #   | What is compared           | Items with a value | Lowest                   | Highest                   | Distinct values |
| --- | -------------------------- | ------------------ | ------------------------ | ------------------------- | --------------- |
| 13  | Total price                | 113 of 113         | Crimson Lucidity: 900    | Rabadon's Deathcap: 3,500 | 28              |
| 14  | Gold efficiency from stats | 113 of 113         | Sterak's Gage: 39.8%     | Gunmetal Greaves: 175.7%  | 104             |
| 15  | Attack damage              | 44 of 113          | Guinsoo's Rageblade: 30  | Bloodthirster: 80         | 11              |
| 16  | Ability power              | 36 of 113          | Mejai's Soulstealer: 20  | Rabadon's Deathcap: 130   | 17              |
| 17  | Health                     | 45 of 113          | Mejai's Soulstealer: 100 | Warmog's Armor: 1,000     | 14              |
| 18  | Armor                      | 16 of 113          | Bandlepipes: 20          | Thornmail: 75             | 9               |
| 19  | Magic resistance           | 14 of 113          | Bandlepipes: 20          | Kaenic Rookern: 80        | 9               |
| 20  | Ability haste              | 53 of 113          | Actualizer: 10           | Horizon Focus: 25         | 4               |

Things to know:

- **#13 Price** is the current total price from Data Dragon.
- **#14 Gold efficiency** is the gold value of the item's stats divided by its price. The gold value
  of each stat (for example 35 gold per point of attack damage) comes from the League of Legends
  Wiki's gold value table. **Passives and active effects are not valued**, so items built around a
  passive score low (Rabadon's Deathcap is about 74%) and cheap boots with good stats score very
  high (over 170%). An item with a stat that has no known gold value is left out of this question
  instead of getting a wrong number.
- **#15 to #20 Stat questions** are only asked among items that actually have that stat, so an
  armor round compares four items that all grant armor. The number is the item's listed stat, not
  including any bonus a passive adds (Rabadon's +130 ability power excludes its +30% passive).
- **#20 Ability haste** has only four different values (10, 15, 20, 25), so it can only appear when
  four items with four different values exist and the gap is large enough. In practice it is rare.

## Which round a question appears in

A question needs a big enough gap for easy rounds and enough different values for hard ones. Share
of appearances per round, from the two-year simulation:

| #   | Question              | R1  | R2   | R3  | R4  | R5  | Note                                          |
| --- | --------------------- | --- | ---- | --- | --- | --- | --------------------------------------------- |
| 1   | Skins                 | 28% | 11%  | 20% | 16% | 25% | Any round                                     |
| 2   | Release date          | 25% | 15%  | 22% | 16% | 22% | Any round                                     |
| 3   | Base health           | 0%  | 39%  | 31% | 12% | 18% | Values are close together, so never a 30% gap |
| 4   | Health per level      | 27% | 14%  | 14% | 25% | 20% | Any round                                     |
| 5   | Health regeneration   | 28% | 16%  | 20% | 11% | 24% | Any round                                     |
| 6   | Base armor            | 24% | 14%  | 21% | 15% | 26% | Any round                                     |
| 7   | Base magic resistance | 0%  | 34%  | 20% | 21% | 26% | Values are close together                     |
| 8   | Base attack damage    | 25% | 15%  | 23% | 15% | 23% | Any round                                     |
| 9   | Base attack speed     | 0%  | 36%  | 27% | 16% | 21% | Values are close together                     |
| 10  | Attack range          | 28% | 15%  | 20% | 14% | 23% | Any round                                     |
| 11  | Movement speed        | 0%  | 0%   | 0%  | 73% | 27% | Only 8 values, all close: hard rounds only    |
| 12  | Patch notes           | 24% | 15%  | 22% | 17% | 22% | Any round                                     |
| 13  | Item cost             | 24% | 19%  | 17% | 18% | 21% | Any round                                     |
| 14  | Gold efficiency       | 21% | 15%  | 23% | 17% | 24% | Any round                                     |
| 15  | Item attack damage    | 35% | 21%  | 26% | 19% | 0%  | Few distinct values: never the closest round  |
| 16  | Item ability power    | 26% | 12%  | 17% | 16% | 29% | Any round                                     |
| 17  | Item health           | 20% | 18%  | 15% | 23% | 24% | Any round                                     |
| 18  | Item armor            | 25% | 21%  | 25% | 28% | 0%  | Few distinct values: never the closest round  |
| 19  | Item magic resistance | 35% | 19%  | 26% | 20% | 0%  | Few distinct values: never the closest round  |
| 20  | Item ability haste    | 0%  | 100% | 0%  | 0%  | 0%  | Only 4 values: round 2 only, and rarely       |

So the first round is usually a clear-cut question, and movement speed is always a close call.

## Rules that apply to every question

- **Highest wins.** Every question is phrased so that the highest value is the answer ("most",
  "highest", "most recently").
- **Real numbers are shown after answering.** All four values are revealed, formatted as in the
  tables above (numbers with thousands separators, dates as "Jun 13, 2013", percentages with one
  decimal).
- **Same puzzle for everyone.** The puzzle is generated from the date (UTC), so every player gets
  the same questions in the same order on the same day.
- **New data starts the next day.** After a new patch, new values apply from the next UTC midnight so
  a puzzle never changes while someone is playing it.
- **Earlier days.** The previous 7 days can be replayed; their results do not count for the streak.

## Seeing all questions

The endless mode (`/?mode=endless`) shows random questions without end and a table of which ones
have appeared. See [LOCAL_TESTING.md](LOCAL_TESTING.md#endless-mode-testing-every-question).

## Where to change things

| To...                                 | Edit                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Add or reword a question              | `data/questions.json`                                                     |
| Ask about specific champions or items | `data/questions.json` (pick question, see below)                          |
| Limit who can be an answer            | `correct`, `wrong` or `exclude` on the question in `data/questions.json`  |
| Add a champion stat                   | `pipeline/stats/` (one file each, list them in `pipeline/stats/index.ts`) |
| Add or change an item stat            | `pipeline/stats/itemStats.ts`                                             |
| Change which items are used           | `pipeline/items/selectItems.ts`                                           |
| Change how hard rounds are            | `src/game/generate/config.ts`                                             |

A stat only becomes a question once `data/questions.json` has an entry for it. Which stat is a
champion stat and which an item stat follows from the list it is registered in.

### Adding a question about specific champions or items

A question that is not about a stat (for example "which of these is a marksman?") needs no code
and no data refresh, only an entry in `data/questions.json`:

```json
{
  "id": "isMarksman",
  "category": "trivia",
  "difficulty": "easy",
  "subject": "champion",
  "label": "Marksmen",
  "question": "Which of these champions is a marksman?",
  "correct": ["Jinx", "Ashe", "Caitlyn"],
  "wrong": ["Garen", "Lux", "Zed", "Soraka"]
}
```

- Every question also has a `category` (`stats` or `trivia`; use `trivia` for these) and a
  `difficulty`, see below.
- `subject` is `champion` or `item`. `label` is the short name in the results.
- Each day the round shows one champion from `correct` and three from `wrong`, drawn at random,
  so the longer the lists, the more variety. `wrong` needs at least 3 entries. `exclude` works as
  for the other questions.
- Write the question so the options are the answer's kind ("Which of these champions ..." or
  "Which of these items ...").
- There are no numbers to reveal, so there is no gap-based difficulty: you pick one with `difficulty`.
- Ids are Data Dragon ids (`MissFortune`, `Kaisa`, `3031`). `npm run data:refresh` fails if an id
  disappears from the game, so a stale list is noticed.

### Category and difficulty

Both fields are required on every question.

- `category`: `stats` (compares a number), `trivia` (game knowledge) or `lore` (the story of
  champions and the world) or `esports` (professional play). Only for grouping for now.
- `difficulty`: which rounds the question may appear in. A day has five rounds, tiered easy,
  easy, medium, hard, hard.

| `difficulty` | Appears in rounds |
| ------------ | ----------------- |
| `easy`       | 1 and 2           |
| `medium`     | 3                 |
| `hard`       | 4 and 5           |
| `variable`   | any               |

Stat questions are all `variable`: how hard they are depends on the round, because the gap
between the best and second-best option narrows each round. The marksman question is `easy`,
as its wrong options are clearly not marksmen.

### Lore questions

Lore questions are pick questions with `"category": "lore"`. Current ones: which champion is from
each region (Demacia, Noxus, Freljord, Ionia, Piltover, Zaun, Shadow Isles, Bilgewater, Mount
Targon), and which is a yordle, a Void creature or a Darkin. The lists are written by hand, so check
them against the [League of Legends wiki](https://wiki.leagueoflegends.com) when you change them.
Leave out champions whose lore is ambiguous or has changed (for example someone born in one region
and living in another) rather than risk an unfair question. A region question's wrong options come
from other regions, so a champion may be a yordle or a marksman and still be a fair option.

### Esports questions

Esports questions are pick questions with `"category": "esports"`. The two so far ask which
champion has a skin from the esports team T1 (including the earlier SKT T1 line, `medium`) and
which has a Worlds skin (`hard`). Their lists come from the skin names in Data Dragon, not from
memory, and every wrong option is a champion with no esports skin at all (no T1, Worlds, Victorious,
Dragonslayer or MSI skin). Riot adds esports skins over time, so a champion in a wrong list can
become correct: when a new esports skin line appears, check the wrong lists.

### Restricting a question

```json
{
  "id": "baseHealth",
  "category": "stats",
  "difficulty": "variable",
  "stat": "baseHealth",
  "question": "Which champion has the highest base health?",
  "correct": ["Tryndamere", "Sion"],
  "wrong": ["Kled", "Yuumi", "Lux", "Soraka"],
  "exclude": ["Aatrox"]
}
```

- `correct`: only these can be the right answer. Without it, anyone with the stat can be.
- `wrong`: only these can be the other three options. Without it, anyone with a lower value can be.
- `exclude`: never shown, neither as answer nor as option.
- The right answer is still always the highest value and the difficulty gap still applies, so a
  list that leaves too few possibilities means the question is skipped at that difficulty. An id
  may appear in only one of the three lists. Ids are Data Dragon ids (`MissFortune`, `3031`).

Then run `npm run data:refresh` and `npm run check`. More in [CLAUDE.md](../CLAUDE.md).
