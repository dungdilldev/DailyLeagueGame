import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const PARTIAL_PATTERN = /<!--include:([\w-]+)-->/g;
const PARTIALS_DIRECTORY = './src/pages/partials/';
const PAGES = ['index', 'how-to-play', 'about', 'privacy'];

/** Lets the static pages share their header, footer and contact link: `<!--include:name-->`. */
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

export default defineConfig({
  plugins: [preact(), includePartials()],
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
