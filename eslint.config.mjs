import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'reference/**',
      'mcci-digital-prototypes/**',
      'mobile/**',
      'test-results/**',
      'playwright-report/**',
      'lib/supabase/types.ts',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/supabase/admin',
              message:
                'Service-role client: only cron handlers, PDF generation and /api/verify (docs/01-architecture.md).',
            },
          ],
        },
      ],
    },
  },
  {
    // Playwright fixtures must be destructured, even when a callback needs none: ({}, testInfo) => …
    files: ['tests/e2e/**'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    // the places allowed to use the service-role client
    files: ['app/api/**', 'lib/pdf/**', 'lib/supabase/admin.ts', 'tests/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

export default config;
