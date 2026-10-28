import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

// FSD layers, top to bottom. A layer may import only from layers below it.
const layers = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];
const slicedLayers = ['views', 'widgets', 'features', 'entities'];

// Bans imports from the layers above `layer` and from other slices on the same layer.
// Inside a slice, use relative imports; `@/<layer>/...` from the same layer is another slice.
const layerRestrictions = (layer) => {
  const index = layers.indexOf(layer);
  const forbidden = layers.slice(0, slicedLayers.includes(layer) ? index + 1 : index);
  const layerPatterns = forbidden.map((upper) => ({
    group: [`@/${upper}`, `@/${upper}/**`],
    message:
      upper === layer
        ? `Do not import another ${layer} slice. Move shared code down to entities/ or shared/.`
        : `FSD: ${layer}/ must not import from ${upper}/ (a layer above).`,
  }));
  return serverImportingLayers.includes(layer) ? layerPatterns : [...layerPatterns, serverBan];
};

// Only app/ (Route Handlers, Server Actions, Server Components) and views/ (Server Components)
// may import server/. Lower layers are routinely pulled into client bundles.
const serverImportingLayers = ['app', 'views'];
const serverBan = {
  group: ['@/server', '@/server/**'],
  message: 'server/ is backend-only. Reach it through a Route Handler or Server Action in app/.',
};

const publicApiRestrictions = [
  {
    group: slicedLayers.map((layer) => `@/${layer}/*/**`),
    message: 'Import a slice through its public API (index.ts), not a deep path.',
  },
  {
    group: ['@/shared/*/**'],
    message: 'Import shared code through its segment index, e.g. @/shared/ui.',
  },
];

const restrictImports = (patterns) => ({
  'no-restricted-imports': ['error', { patterns: [...patterns, ...publicApiRestrictions] }],
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // No TypeScript escape hatches. `as const` stays allowed.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            unknown: 'Narrow with a type guard, a discriminated union or Zod parsing instead.',
          },
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSQualifiedName[left.name='React']",
          message: "Import React types by name: import type { ReactNode } from 'react'.",
        },
        {
          selector:
            "Program:has(> ExpressionStatement[directive='use client']) ImportDeclaration[source.value=/^@\\/server(\\/|$)/]",
          message:
            "A 'use client' module must not import server/. Use a Route Handler or Server Action.",
        },
      ],
      ...restrictImports([]),
    },
  },
  ...layers.map((layer) => ({
    files: [`src/${layer}/**`],
    rules: restrictImports(layerRestrictions(layer)),
  })),
  {
    files: ['src/server/**'],
    rules: restrictImports([
      {
        group: ['@/app', '@/app/**', '@/views', '@/views/**', '@/widgets', '@/widgets/**'],
        message: 'server/ must not import app, views or widgets.',
      },
      { group: ['@/features', '@/features/**'], message: 'server/ must not import features.' },
      { group: ['@/entities/*/ui', '@/entities/*/ui/**'], message: 'server/ must not import UI.' },
    ]),
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/shared/testing/**'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // Must come last: turns off ESLint rules that conflict with Prettier formatting.
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
