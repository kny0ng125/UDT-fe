import type { Config } from 'jest';

const config: Config = {
  displayName: '@udt/ui',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts(x)?'],
};

export default config;
