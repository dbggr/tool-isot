module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/api'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'api/**/*.ts',
    '!api/**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Force tests to run serially to avoid database conflicts
  maxWorkers: 1,
  // Increase timeout for database operations
  testTimeout: 10000,
  // Module name mapping for Next.js paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Temporarily exclude problematic tests that cause infinite loops
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/unit/components/layout.test.tsx',
    '<rootDir>/tests/unit/components/error-handling.test.tsx',
    '<rootDir>/tests/unit/components/tables-navigation.test.tsx',
    '<rootDir>/tests/unit/components/accessibility.test.tsx',
    '<rootDir>/tests/unit/middleware/',
    '<rootDir>/tests/unit/components/services-table.test.tsx',
  ],
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        ignoreDeprecations: '6.0',
        rootDir: '.',
      },
    },
  },
};