// eslint.config.mjs
// Compatible with ESLint v8.57+ flat config

import globals from 'globals'

export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],

    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      }
    },

    rules: {
      // ESLint core rules — no plugin needed for these
      'no-console': 'warn',
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'semi': ['error', 'never'],
      'quotes': ['error', 'single']
    }
  },

  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/'
    ]
  }
]