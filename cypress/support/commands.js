/**
 * Cypress Custom Commands
 *
 * Additional Cypress commands for PolyProp testing:
 * - Authentication helpers
 * - Navigation utilities
 * - Data manipulation commands
 * - Assertion helpers
 */

// Authentication commands
Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.get('[data-testid="auth-button"]').click();
  cy.get('[data-testid="privy-modal"]').should('be.visible');

  // Fill in authentication form
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);

  cy.get('[data-testid="login-submit"]').click();

  // Verify successful login
  cy.get('[data-testid="user-profile"]').should('be.visible');
});

Cypress.Commands.add('loginViaAPI', (user = {}) => {
  const defaultUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    wallet: '0x1234567890123456789012345678901234567890',
    ...user,
  };

  // Set authentication tokens in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('privy-authenticated', 'true');
    win.localStorage.setItem('privy-user-id', defaultUser.id);
    win.localStorage.setItem('privy-wallet-address', defaultUser.wallet);
    win.localStorage.setItem('privy-email', defaultUser.email);
  });

  // Verify user is logged in
  cy.get('[data-testid="user-profile"]').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  // Click logout button or clear authentication
  cy.get('[data-testid="logout-button"]').click();

  // Verify logout
  cy.get('[data-testid="auth-button"]').should('be.visible');
  cy.get('[data-testid="user-profile"]').should('not.exist');
});

// Navigation commands
Cypress.Commands.add('goToMarkets', () => {
  cy.get('[data-testid="nav-markets"]').click();
  cy.url().should('include', '/markets');
  cy.get('[data-testid="markets-page"]').should('be.visible');
});

Cypress.Commands.add('goToTraders', () => {
  cy.get('[data-testid="nav-traders"]').click();
  cy.url().should('include', '/traders');
  cy.get('[data-testid="traders-page"]').should('be.visible');
});

Cypress.Commands.add('goToLeaderboard', () => {
  cy.get('[data-testid="nav-leaderboard"]').click();
  cy.url().should('include', '/leaderboard');
  cy.get('[data-testid="leaderboard-page"]').should('be.visible');
});

Cypress.Commands.add('goToLPs', () => {
  cy.get('[data-testid="nav-lps"]').click();
  cy.url().should('include', '/lps');
  cy.get('[data-testid="lps-page"]').should('be.visible');
});

// Market interaction commands
Cypress.Commands.add('searchMarkets', (query) => {
  cy.get('[data-testid="markets-search-input"]').clear().type(query);
  cy.get('[data-testid="search-button"]').click();

  // Wait for search results
  cy.get('[data-testid="market-results"]').should('be.visible');
});

Cypress.Commands.add('filterMarketsByCategory', (category) => {
  cy.get('[data-testid="category-filter"]').select(category);

  // Verify filter is applied
  cy.get('[data-testid="active-filter"]').should('contain', category);
});

Cypress.Commands.add('openMarketDetails', (marketId) => {
  cy.get(`[data-testid="market-card-${marketId}"]`).click();
  cy.get('[data-testid="market-details-modal"]').should('be.visible');
});

Cypress.Commands.add('placeMarketOrder', (marketId, side, amount) => {
  cy.get(`[data-testid="market-card-${marketId}"]`).find('[data-testid="order-button"]').click();
  cy.get('[data-testid="order-modal"]').should('be.visible');

  // Fill order details
  cy.get('[data-testid="order-side"]').select(side);
  cy.get('[data-testid="order-amount"]').clear().type(amount);

  // Submit order
  cy.get('[data-testid="submit-order"]').click();

  // Verify order confirmation
  cy.get('[data-testid="order-confirmation"]').should('be.visible');
});

// Trading commands
Cypress.Commands.add('viewPositions', () => {
  cy.get('[data-testid="tab-positions"]').click();
  cy.get('[data-testid="positions-table"]').should('be.visible');
});

Cypress.Commands.add('viewPerformance', () => {
  cy.get('[data-testid="tab-performance"]').click();
  cy.get('[data-testid="performance-charts"]').should('be.visible');
});

Cypress.Commands.add('closePosition', (positionId) => {
  cy.get(`[data-testid="position-${positionId}"]`).find('[data-testid="close-button"]').click();
  cy.get('[data-testid="close-modal"]').should('be.visible');
  cy.get('[data-testid="confirm-close"]').click();

  // Verify position is closed
  cy.get(`[data-testid="position-${positionId}"]`).should('have.class', 'closed');
});

// Data manipulation commands
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase', {
    users: 5,
    markets: 10,
    trades: 20,
  });
});

Cypress.Commands.add('clearTestData', () => {
  cy.task('clearDatabase');
});

// Assertion helpers
Cypress.Commands.add('shouldHaveBalance', (expectedBalance) => {
  cy.get('[data-testid="user-balance"]').should('contain', expectedBalance);
});

Cypress.Commands.add('shouldHaveNotification', (type, message) => {
  cy.get(`[data-testid="notification-${type}"]`).should('be.visible').and('contain', message);
});

Cypress.Commands.add('shouldHaveToast', (type, message) => {
  cy.get(`[data-testid="toast-${type}"]`).should('be.visible').and('contain', message);
});

Cypress.Commands.add('shouldBeOnPage', (pageName) => {
  cy.get(`[data-testid="${pageName}-page"]`).should('be.visible');
  cy.url().should('include', `/${pageName}`);
});

// Performance testing
Cypress.Commands.add('measurePageLoad', (pageName) => {
  const startTime = performance.now();

  cy.visit(`/${pageName}`);

  cy.get(`[data-testid="${pageName}-page"]`).should('be.visible').then(() => {
    const loadTime = performance.now() - startTime;
    cy.log(`Page load time for ${pageName}: ${loadTime.toFixed(2)}ms`);

    // Assert reasonable load time
    expect(loadTime).to.be.lessThan(3000); // 3 seconds
  });
});

// API mocking helpers
Cypress.Commands.add('mockMarketsAPI', (markets = []) => {
  cy.intercept('GET', '/api/markets*', {
    statusCode: 200,
    body: {
      markets,
      total: markets.length,
      next: null,
    },
  }).as('getMarkets');
});

Cypress.Commands.add('mockLeaderboardAPI', (traders = []) => {
  cy.intercept('GET', '/api/leaderboard*', {
    statusCode: 200,
    body: {
      traders,
      total: traders.length,
    },
  }).as('getLeaderboard');
});

Cypress.Commands.add('mockRiskAPI', (alert = false) => {
  cy.intercept('GET', '/api/risk*', {
    statusCode: 200,
    body: {
      alert,
      message: alert ? 'High risk detected' : '',
      severity: alert ? 'high' : 'low',
      metrics: {
        maxDrawdown: alert ? 5.5 : 1.2,
        totalExposure: 50000,
        concentrationRisk: 15.2,
      },
    },
  }).as('getRisk');
});

// Error simulation
Cypress.Commands.add('simulateNetworkError', (url) => {
  cy.intercept(url, {
    statusCode: 500,
    body: {
      error: 'Internal Server Error',
      message: 'Something went wrong',
    },
  });
});

Cypress.Commands.add('simulateSlowNetwork', (url, delay = 3000) => {
  cy.intercept(url, (req) => {
    req.reply((res) => {
      // Delay the response
      setTimeout(() => {
        res.send({
          statusCode: 200,
          body: res.body,
        });
      }, delay);
    });
  });
});

// Accessibility helpers
Cypress.Commands.add('checkAriaLabels', () => {
  // Check common interactive elements have aria-labels
  cy.get('button').each(($btn) => {
    cy.wrap($btn).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  });

  cy.get('input').each(($input) => {
    cy.wrap($input).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  });
});

Cypress.Commands.add('testKeyboardNavigation', () => {
  // Test tab navigation through interactive elements
  cy.get('body').tab().tab().tab(); // Tab through first few elements
  cy.focused().should('be.visible');
});

// Visual testing
Cypress.Commands.add('compareScreenshot', (name, threshold = 0.01) => {
  cy.screenshot(name, { capture: 'fullPage' });

  // In a real setup, you'd compare against baseline images
  // For now, just log that screenshot was taken
  cy.log(`Screenshot taken: ${name}`);
});

// Mobile testing helpers
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport('iphone-x');
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport('ipad-2');
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720);
});

// Data validation helpers
Cypress.Commands.add('validateMarketData', () => {
  cy.get('[data-testid="market-card"]').each(($card) => {
    // Validate required market data fields
    cy.wrap($card).find('[data-testid="market-title"]').should('not.be.empty');
    cy.wrap($card).find('[data-testid="market-price"]').should('match', /^\d+\.\d+$/);
    cy.wrap($card).find('[data-testid="market-volume"]').should('match', /^\$[\d,]+/);
  });
});

Cypress.Commands.add('validateTradeData', () => {
  cy.get('[data-testid="trade-row"]').each(($row) => {
    // Validate trade data structure
    cy.wrap($row).find('[data-testid="trade-amount"]').should('match', /^\d+$/);
    cy.wrap($row).find('[data-testid="trade-pnl"]').should('match', /^[\+\-]?\$\d+\.\d+$/);
    cy.wrap($row).find('[data-testid="trade-status"]').should('not.be.empty');
  });
});
