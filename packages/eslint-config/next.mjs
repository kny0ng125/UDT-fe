import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';

/**
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import("eslint").ESLint.FlatConfigArray}
 */
export default function createConfig({ tsconfigRootDir }) {
  return [
    {
      ignores: ['node_modules/', '.next/', 'public/'],
    },

    {
      files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
      plugins: {
        '@next/next': nextPlugin,
      },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
      },
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          React: 'readonly',
        },
      },
    },

    // phantom(유령) 의존성 방지: import 했지만 해당 워크스페이스 package.json 에
    // 선언되지 않은 패키지를 에러로 잡는다. tsconfig paths(@app/* 등)는
    // typescript resolver 로 로컬 해석되어 오탐되지 않는다.
    {
      files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
      plugins: {
        'import-x': importX,
      },
      settings: {
        'import-x/resolver': {
          typescript: { alwaysTryTypes: true },
          node: true,
        },
      },
      rules: {
        'import-x/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },

    {
      files: ['**/*.{ts,tsx}'],
      ignores: ['.storybook/**/*.{ts,tsx}'],
      plugins: {
        '@typescript-eslint': typescriptEslintPlugin,
      },
      languageOptions: {
        parser: typescriptEslintParser,
        parserOptions: {
          project: true,
          tsconfigRootDir,
        },
      },
      rules: {
        ...typescriptEslintPlugin.configs.recommended.rules,
      },
    },

    {
      files: ['.storybook/**/*.{ts,tsx}'],
      plugins: {
        '@typescript-eslint': typescriptEslintPlugin,
      },
      languageOptions: {
        parser: typescriptEslintParser,
        parserOptions: {
          project: ['.storybook/tsconfig.json'],
          tsconfigRootDir,
        },
      },
      rules: {
        ...typescriptEslintPlugin.configs.recommended.rules,
      },
    },

    prettierConfig,

    ...storybook.configs['flat/recommended'],
  ];
}
