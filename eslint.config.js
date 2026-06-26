import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Valid React pattern for resetting derived state; React Compiler rule is overly strict
      'react-hooks/set-state-in-effect': 'warn',
      // HMR/hot-reload DX only — does not affect production builds
      'react-refresh/only-export-components': 'warn',
      // React Compiler optimization hint; not a correctness bug
      'react-hooks/preserve-manual-memoization': 'warn',
      // Allow _-prefixed identifiers as intentional "unused" markers
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
])
