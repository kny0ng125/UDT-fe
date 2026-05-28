import type { Config } from 'jest';

const webDir = 'apps/web';
const adminDir = 'apps/admin';

const moduleNameMapper: Record<string, string> = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@app/(.*)$': '<rootDir>/src/app/$1',
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  '^@type/(.*)$': '<rootDir>/src/types/$1',
  '^@styles/(.*)$': '<rootDir>/src/styles/$1',
  '^@store/(.*)$': '<rootDir>/src/store/$1',
  '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  '\\.(css|scss|sass|less)$': '<rootDir>/tests/mocks/style-mock.js',
  '\\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$':
    '<rootDir>/tests/mocks/file-mock.js',
};

const transform = {
  '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': [
    '@swc/jest',
    {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: false,
          dynamicImport: true,
        },
        transform: {
          react: { runtime: 'automatic' },
        },
        target: 'es2020',
      },
      module: { type: 'commonjs' },
    },
  ],
} as const;

const config: Config = {
  projects: [
    {
      displayName: 'web-unit',
      testEnvironment: 'node',
      rootDir: webDir,
      testMatch: [
        '<rootDir>/src/**/*.test.ts',
        '<rootDir>/tests/unit/**/*.test.ts',
      ],
      moduleNameMapper,
      transform,
    },
    {
      displayName: 'web-integration',
      testEnvironment: 'jest-fixed-jsdom',
      rootDir: webDir,
      testMatch: [
        '<rootDir>/src/**/*.test.tsx',
        '<rootDir>/tests/integration/**/*.{test,spec}.{ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper,
      transform,
      transformIgnorePatterns: [
        '/node_modules/(?!(msw|@mswjs|@bundled-es-modules|until-async|strict-event-emitter|rettime|headers-polyfill|@open-draft|outvariant)/)',
      ],
    },
    {
      displayName: 'admin-unit',
      testEnvironment: 'node',
      rootDir: adminDir,
      testMatch: [
        '<rootDir>/src/**/*.test.ts',
        '<rootDir>/tests/unit/**/*.test.ts',
      ],
      moduleNameMapper,
      transform,
    },
    {
      displayName: 'admin-integration',
      testEnvironment: 'jest-fixed-jsdom',
      rootDir: adminDir,
      testMatch: [
        '<rootDir>/src/**/*.test.tsx',
        '<rootDir>/tests/integration/**/*.{test,spec}.{ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper,
      transform,
      transformIgnorePatterns: [
        '/node_modules/(?!(msw|@mswjs|@bundled-es-modules|until-async|strict-event-emitter|rettime|headers-polyfill|@open-draft|outvariant)/)',
      ],
    },
  ],
};

export default config;
