import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-ads-test', 'coverage', 'node_modules', 'public/data'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Ads belong on the game page (play.html) only, decided by the owner: the start page and the
    // information pages must never load ad code, so their scripts may not import it.
    files: ['src/pages/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ads/*', '**/AdSlot'],
              message: 'Ads are shown on play.html only, not on the start or information pages.',
            },
          ],
        },
      ],
    },
  },
  { files: ['*.js'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
