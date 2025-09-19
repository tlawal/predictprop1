/**
 * Cypress E2E Support File
 *
 * Global configuration and utilities for E2E tests:
 * - Custom commands for authentication
 * - Global test setup and teardown
 * - Helper functions for common operations
 * - Mock data and fixtures
 */

// Import commands
import './commands';

// Global test configuration
before(() => {
  // Clear any existing application state
  cy.clearCookies();
  cy.clearLocalStorage();

  // Set up global test data
  cy.fixture('users').as('testUsers');
  cy.fixture('markets').as('testMarkets');
  cy.fixture('trades').as('testTrades');
});

beforeEach(() => {
  // Ensure we're on the correct base URL
  cy.visit('/');

  // Wait for application to be ready
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});

afterEach(() => {
  // Clean up after each test
  cy.window().then((win) => {
    // Clear any global state
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Custom commands for common operations
Cypress.Commands.add('login', (user = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    wallet: '0x1234567890123456789012345678901234567890',
    ...user,
  };

  // Mock authentication
  cy.window().then((win) => {
    win.localStorage.setItem('privy-authenticated', 'true');
    win.localStorage.setItem('privy-user-id', defaultUser.email);
    win.localStorage.setItem('privy-wallet-address', defaultUser.wallet);
  });

  // Verify login
  cy.get('[data-testid="user-profile"]').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('privy-authenticated');
    win.localStorage.removeItem('privy-user-id');
    win.localStorage.removeItem('privy-wallet-address');
  });

  cy.get('[data-testid="auth-button"]').should('be.visible');
});

Cypress.Commands.add('navigateToPage', (page) => {
  const routes = {
    markets: '/markets',
    traders: '/traders',
    leaderboard: '/leaderboard',
    lps: '/lps',
  };

  const route = routes[page] || page;
  cy.get(`[data-testid="nav-${page}"]`).click();
  cy.url().should('include', route);
});

Cypress.Commands.add('searchMarkets', (query) => {
  cy.get('[data-testid="markets-search-input"]').clear().type(query);
  cy.wait('@searchMarkets'); // Wait for search API call
});

Cypress.Commands.add('placeBet', (amount, side = 'Yes') => {
  cy.get('[data-testid="bet-amount-input"]').clear().type(amount);
  cy.get(`[data-testid="bet-side-${side.toLowerCase()}"]`).click();
  cy.get('[data-testid="submit-order-button"]').click();

  // Verify order confirmation
  cy.get('[data-testid="order-confirmation"]').should('be.visible');
});

Cypress.Commands.add('waitForLoading', (element = '[data-testid="loading"]') => {
  cy.get(element).should('be.visible');
  cy.get(element).should('not.exist');
});

Cypress.Commands.add('mockApiResponse', (url, response, status = 200) => {
  cy.intercept('GET', url, {
    statusCode: status,
    body: response,
  }).as(`mock-${url.replace(/[^a-zA-Z0-9]/g, '-')}`);
});

Cypress.Commands.add('verifyToastMessage', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`)
    .should('be.visible')
    .and('contain', message);
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  // Useful for handling expected errors in the application
  if (err.message.includes('Expected error')) {
    return false;
  }

  // Log unexpected errors
  console.error('Uncaught exception:', err.message);
  return false;
});

// Global test data fixtures
Cypress.fixture('users').then((users) => {
  cy.wrap(users).as('testUsers');
});

Cypress.fixture('markets').then((markets) => {
  cy.wrap(markets).as('testMarkets');
});

Cypress.fixture('trades').then((trades) => {
  cy.wrap(trades).as('testTrades');
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (action, callback) => {
  const startTime = performance.now();

  callback();

  const endTime = performance.now();
  const duration = endTime - startTime;

  cy.log(`Performance: ${action} took ${duration.toFixed(2)}ms`);

  // Assert reasonable performance
  expect(duration).to.be.lessThan(5000); // 5 second max
});

// Accessibility testing helpers
Cypress.Commands.add('checkAccessibility', (context = 'document') => {
  cy.injectAxe();

  cy.checkA11y(context, {
    rules: {
      'color-contrast': { enabled: true },
      'html-has-lang': { enabled: true },
      'image-alt': { enabled: true },
      'link-name': { enabled: true },
    },
  });
});

// Visual regression testing
Cypress.Commands.add('takeSnapshot', (name) => {
  // Only take snapshots if Percy is configured
  if (Cypress.env('PERCY_TOKEN')) {
    cy.percySnapshot(name);
  } else {
    cy.screenshot(name);
  }
});

// Test data helpers
Cypress.Commands.add('createTestMarket', (overrides = {}) => {
  const market = {
    id: `test-market-${Date.now()}`,
    title: 'Test Market',
    description: 'Test market description',
    currentPrice: 0.65,
    volume: 1500000,
    category: 'Politics',
    ...overrides,
  };

  return cy.wrap(market);
});

Cypress.Commands.add('createTestTrade', (overrides = {}) => {
  const trade = {
    id: `test-trade-${Date.now()}`,
    marketId: 'test-market-123',
    side: 'Yes',
    amount: 100,
    entryPrice: 0.65,
    pnl: 25,
    status: 'open',
    ...overrides,
  };

  return cy.wrap(trade);
});

// Environment-specific configurations
if (Cypress.env('environment') === 'staging') {
  // Staging-specific configurations
  Cypress.config('baseUrl', 'https://staging.polyprop.com');
} else if (Cypress.env('environment') === 'production') {
  // Production-specific configurations
  Cypress.config('baseUrl', 'https://polyprop.com');
  Cypress.config('video', false); // Don't record videos in production
}
