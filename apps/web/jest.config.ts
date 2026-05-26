import type { Config } from 'jest';

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
  '^.+\\.(ts|tsx)$': [
    'ts-jest',
    {
      tsconfig: '<rootDir>/tsconfig.jest.json',
      isolatedModules: true,
    },
  ],
} as const;

const config: Config = {
  projects: [
    {
      displayName: 'web-unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      moduleNameMapper,
      transform,
    },
    {
      displayName: 'web-integration',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/**/*.test.tsx',
        '<rootDir>/tests/integration/**/*.{test,spec}.{ts,tsx}',
      ],
      setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper,
      transform,
    },
  ],
};

export default config;
