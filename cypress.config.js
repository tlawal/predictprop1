/**
 * Cypress Configuration for PolyProp
 *
 * Configures Cypress for end-to-end testing with:
 * - Component testing support
 * - Custom viewport configurations
 * - Environment variables
 * - Video recording and screenshots
 */

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Project ID for Cypress Dashboard
  projectId: 'polyprop-e2e',

  // E2E testing configuration
  e2e: {
    // Base URL for tests
    baseUrl: 'http://localhost:3001',

    // Test file patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Support file for custom commands and utilities
    supportFile: 'cypress/support/e2e.js',

    // Viewport configurations
    viewportWidth: 1280,
    viewportHeight: 720,

    // Video recording
    video: true,
    videoCompression: 32,
    videoUploadOnPasses: false,

    // Screenshots
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Environment variables
    env: {
      API_URL: 'http://localhost:3001',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_WALLET: '0x1234567890123456789012345678901234567890',
      CYPRESS_RECORD_KEY: process.env.CYPRESS_RECORD_KEY,
    },

    // Setup Node events
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      // Example: on('task', { ... })

      // Custom task for database seeding
      on('task', {
        seedDatabase(data) {
          // Custom database seeding logic
          return true;
        },

        clearDatabase() {
          // Custom database clearing logic
          return true;
        },
      });

      return config;
    },
  },

  // Component testing configuration
  component: {
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },

  // Global configuration
  watchForFileChanges: true,
  chromeWebSecurity: false,
  experimentalStudio: true,
  experimentalWebKitSupport: true,

  // Reporter configuration
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportPageTitle: 'PolyProp Test Report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
});
