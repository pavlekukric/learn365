import nextPlugin from '@next/eslint-plugin-next';
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
  // Phase 14 (review P2 item 21): what `eslint-config-next/core-web-vitals`
  // would bring — the rules of hooks, Next's own checks and accessibility —
  // spread as the plugins' flat configs (the config package itself is
  // eslintrc-only, so it was installed and never applied).
  nextPlugin.flatConfig.coreWebVitals,
  reactHooks.configs['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    // `.data/` holds git-ignored local probe scripts; e2e/ and the Playwright
    // configs are linted like everything else.
    ignores: ['.next/**', 'next-env.d.ts', '.data/**'],
  },
];
