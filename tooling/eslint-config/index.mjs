import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/design/cloud-design-v1/**', 'design/cloud-design-v1/**'],
              message:
                'design/cloud-design-v1/ is a visual reference only and must not be imported by production code.',
            },
          ],
        },
      ],
    },
  },
];
