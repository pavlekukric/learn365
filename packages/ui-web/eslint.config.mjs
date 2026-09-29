import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

import sharedConfig from '@learn365/eslint-config';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // Review 2026-09-30 (item 14): every interactive surface lives in this
  // package, so it gets the same rules of hooks and accessibility checks as
  // apps/web — not only the TypeScript base.
  reactHooks.configs['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
];
