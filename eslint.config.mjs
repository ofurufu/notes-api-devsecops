import js from '@eslint/js';

export default [
  // Apply ESLint's recommended rules as the base
  js.configs.recommended,

  {
    // Which files these rules apply to
    files: ['src/**/*.js', 'tests/**/*.js'],

    // Runtime environment — tells ESLint which globals exist
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',      // We use require(), not import
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Jest globals (so ESLint doesn't flag describe/it/expect as undefined)
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      },
    },

    rules: {
      // Errors — these will fail the lint step
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',            // We intentionally use console.log in server
      'no-undef': 'error',

      // Warnings — these won't fail CI but show in output
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },

  {
    // Ignore these paths entirely
    ignores: ['node_modules/**', 'coverage/**'],
  },
];