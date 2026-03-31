import type { Config } from 'jest';

const config: Config = {
  displayName: '@udt/ui',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'esnext',
          moduleResolution: 'bundler',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts(x)?'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
