/**
 * Jest Configuration for PolyProp
 *
 * Configures Jest testing framework with:
 * - React Testing Library for component testing
 * - jsdom environment for DOM simulation
 * - Custom test environment setup
 * - Coverage configuration
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/styles/(.*)$': '<rootDir>/app/styles/$1',
  },

  // File extensions Jest should handle
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!lib/**/*.d.ts',
    '!**/*.config.js',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage report formats
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
  ],

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,

  // Timeout for async tests
  testTimeout: 10000,

  // Verbose output
  verbose: true,
};
