import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslint from '@eslint/js';
import eslintJson from '@eslint/json';
import markdown from '@eslint/markdown';
import vitest from '@vitest/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import jsonc from 'eslint-plugin-jsonc';
import n from 'eslint-plugin-n';
import packageJson from 'eslint-plugin-package-json/experimental';
import perfectionist from 'eslint-plugin-perfectionist';
import * as regexp from 'eslint-plugin-regexp';
import yml from 'eslint-plugin-yml';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const JS_FILES = ['**/*.js'];
const TS_FILES = ['**/*.ts'];
const JS_TS_FILES = [...JS_FILES, ...TS_FILES];

export default defineConfig(
  {
    ignores: [
      '**/*.snap',
      'README.md/*.js',
      'coverage',
      'lib',
      'node_modules',
      'pnpm-lock.yaml',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    extends: [
      eslint.configs.recommended,
      comments.recommended,
      n.configs['flat/recommended'],
      regexp.configs['flat/recommended'],
    ],
    files: JS_TS_FILES,
    plugins: {
      perfectionist,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'n/no-missing-import': 'off',

      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-union-types': 'error',

      // Stylistic concerns that don't interfere with Prettier
      'logical-assignment-operators': [
        'error',
        'always',
        { enforceForIfStatements: true },
      ],
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'operator-assignment': 'error',
    },
    settings: {
      perfectionist: { partitionByComment: true, type: 'natural' },
    },
  },
  {
    extends: [
      jsdoc.configs['flat/contents-typescript-error'],
      jsdoc.configs['flat/logical-typescript-error'],
      jsdoc.configs['flat/stylistic-typescript-error'],
    ],
    files: TS_FILES,
    rules: {
      'jsdoc/match-description': 'off',
    },
  },
  {
    extends: [jsonc.configs['recommended-with-json']],
    files: ['**/*.json', '**/*.jsonc'],
  },
  {
    extends: [packageJson.configs.recommended],
    files: ['package.json'],
    plugins: {
      json: eslintJson,
    },
  },
  {
    extends: [markdown.configs.recommended],
    files: ['**/*.md'],
    ignores: ['CHANGELOG.md'],
    rules: {
      // https://github.com/eslint/markdown/issues/294
      'markdown/no-missing-label-refs': 'off',
    },
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: JS_TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.*s', '.simple-git-hooks.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      // incompatible with `isolatedDeclarations`
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',

      // TODO: Eventually clean this up
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
    settings: {
      vitest: { typecheck: true },
    },
  },
  {
    extends: [vitest.configs.recommended],
    files: ['**/*.test.*'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'vitest/prefer-describe-function-title': 'error',
    },
  },
  {
    extends: [yml.configs['flat/standard'], yml.configs['flat/prettier']],
    files: ['**/*.{yml,yaml}'],
    rules: {
      'yml/file-extension': ['error', { extension: 'yml' }],
      'yml/sort-sequence-values': [
        'error',
        { order: { type: 'asc' }, pathPattern: '^.*$' },
      ],
    },
  },
  {
    files: ['pnpm-workspace.yaml'],
    rules: {
      'yml/file-extension': 'off',
      'yml/sort-keys': [
        'error',
        { order: { type: 'asc' }, pathPattern: '^.*$' },
      ],
    },
  },
  {
    files: ['./eslint.config.js', './**/*.test.*'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
);
