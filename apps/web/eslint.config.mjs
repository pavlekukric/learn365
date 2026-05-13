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
  {
    ignores: ['.next/**', 'next-env.d.ts', 'e2e/**', 'playwright.config.ts'],
  },
];
