import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { runnerImport, type Plugin, type ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';
import { formatUtcDate, isValidUtcDate } from './src/game/date.ts';
import type * as PrerenderModuleExports from './src/prerender/prerenderGamePage.ts';

const PARTIAL_PATTERN = /<!--include:([\w-]+)-->/g;
const PARTIALS_DIRECTORY = './src/pages/partials/';
// One game page per mode (named after GAME_MODES in src/game/gameMode.ts); play.html only
// redirects old links to them.
const PAGES = [
  'index',
  'stats',
  'lore',
  'esports',
  'trivia',
  'mixed',
  'play',
  'how-to-play',
  'about',
  'privacy',
];

/** Lets the static pages share their header, footer, contact link and analytics snippet: `<!--include:name-->`. */
function includePartials(): Plugin {
  return {
    name: 'include-partials',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(PARTIAL_PATTERN, (_match, name: string) =>
          readFileSync(
            new URL(`${PARTIALS_DIRECTORY}${name}.html`, import.meta.url),
            'utf8',
          ).trim(),
        ),
    },
  };
}

const PRERENDER_MODULE = './src/prerender/prerenderGamePage.ts';
type PrerenderModule = typeof PrerenderModuleExports;
const PUBLIC_DIRECTORY = fileURLToPath(new URL('./public/', import.meta.url));

/**
 * The day the game pages are built for: `PUZZLE_DATE` (YYYY-MM-DD) if set, for tests or a build for
 * a given day, otherwise today in UTC. The dev server asks on every page load, so it follows the
 * clock across midnight.
 */
function puzzleDate(): string {
  const requested = process.env['PUZZLE_DATE'];
  if (requested === undefined || requested === '') return formatUtcDate(new Date());
  if (!isValidUtcDate(requested)) {
    throw new Error(`PUZZLE_DATE must be a date written YYYY-MM-DD, not "${requested}"`);
  }
  return requested;
}

/**
 * Builds today's and tomorrow's puzzle into every game page (`src/prerender`). The renderer is
 * app code (components, JSON imports), so Vite loads it: through the dev server while developing,
 * through a module runner once per production build.
 */
function prerenderPuzzles(): Plugin {
  let devServer: ViteDevServer | undefined;
  let forBuild: Promise<PrerenderModule> | undefined;
  const load = async (): Promise<PrerenderModule> => {
    if (devServer) return (await devServer.ssrLoadModule(PRERENDER_MODULE)) as PrerenderModule;
    forBuild ??= runnerImport<PrerenderModule>(
      fileURLToPath(new URL(PRERENDER_MODULE, import.meta.url)),
      { configFile: false, plugins: [preact()], logLevel: 'error' },
    ).then(({ module }) => module);
    return forBuild;
  };
  return {
    name: 'prerender-puzzles',
    configureServer: (server) => {
      devServer = server;
    },
    transformIndexHtml: {
      // After Vite's own processing, which would otherwise try to bundle the option icons.
      order: 'post',
      handler: async (html) =>
        (await load()).prerenderGamePage(html, puzzleDate(), PUBLIC_DIRECTORY),
    },
  };
}

export default defineConfig({
  plugins: [preact(), includePartials(), prerenderPuzzles()],
  // Relative base so the build works on GitHub Pages sub-paths and on root domains.
  base: './',
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        PAGES.map((page) => [page, fileURLToPath(new URL(`./${page}.html`, import.meta.url))]),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
