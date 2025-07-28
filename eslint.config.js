import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'semi': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // JavaScript files (including config files)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
      },
    },
    rules: {
      'semi': ['error', 'always'],
    },
  },
  // API-specific rules (Node.js environment)
  {
    files: ['apps/api/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Mobile app-specific rules (Browser/React Native environment)
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    ignores: ['apps/mobile/*.config.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
    },
  },
  // Mobile app config files (Node.js environment)
  {
    files: ['apps/mobile/*.config.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Shared package rules
  {
    files: ['packages/shared/**/*.{ts}'],
    rules: {
      'no-console': 'error', // Shared packages shouldn't have console statements
    },
  },
  // Ignore patterns
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**', '**/build/**'],
  },
];