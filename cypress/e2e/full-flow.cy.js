/**
 * PolyProp Full User Flow E2E Test
 *
 * This test covers the complete user journey from landing page to trading:
 * 1. Homepage → Challenge selection → Authentication
 * 2. Markets page → Search & filter → Place order
 * 3. Traders page → View positions → Performance analysis
 *
 * Test simulates real user behavior and validates critical user flows.
 * Uses Cypress for browser automation and realistic interaction testing.
 */

describe('PolyProp Full User Flow', () => {
  // Test configuration
  const TEST_TIMEOUT = 30000; // 30 seconds for async operations
  const MARKET_SEARCH_TERM = 'election';
  const TEST_BET_AMOUNT = '100';
  const TEST_BET_SIDE = 'Yes';

  beforeEach(() => {
    // Clear any existing session/cookies before each test
    cy.clearCookies();
    cy.clearLocalStorage();

    // Set longer timeout for API calls and page loads
    cy.intercept('GET', '/api/**', { timeout: TEST_TIMEOUT }).as('apiCall');
    cy.intercept('POST', '/api/**', { timeout: TEST_TIMEOUT }).as('apiPost');
  });

  it('should complete full user journey from homepage to trading', () => {
    // ========================================
    // PHASE 1: HOMEPAGE → CHALLENGE SELECTION
    // ========================================

    /**
     * Step 1: Visit homepage and verify loading
     * - Ensures the landing page loads correctly
     * - Validates core homepage elements are present
     */
    cy.visit('/', { timeout: TEST_TIMEOUT });
    cy.contains('Trade Prediction Markets').should('be.visible');
    cy.contains('with Funded Capital').should('be.visible');

    /**
     * Step 2: Interact with Challenge Plans Table
     * - Find and click on a challenge plan row
     * - This simulates user selecting a trading challenge
     * - Validates challenge selection UI works
     */
    cy.get('[data-testid="challenge-plans-table"]').should('be.visible');
    cy.get('[data-testid="challenge-plans-table"] tbody tr').first().click();

    /**
     * Step 3: Handle Authentication Flow
     * - Click authentication button to trigger Privy modal
     * - Simulate user login process
     * - Wait for authentication to complete
     */
    cy.get('[data-testid="auth-button"]').should('be.visible').click();

    // Handle Privy authentication modal
    cy.get('[data-testid="privy-modal"]').should('be.visible');

    // Simulate successful authentication (mock)
    cy.window().then((win) => {
      // Mock authenticated user state
      win.localStorage.setItem('privy-authenticated', 'true');
      win.localStorage.setItem('privy-user-id', 'test-user-123');
    });

    // Close modal and verify authentication
    cy.get('[data-testid="privy-modal-close"]').click();
    cy.get('[data-testid="user-profile"]').should('be.visible');

    // ========================================
    // PHASE 2: MARKETS PAGE → SEARCH & ORDER
    // ========================================

    /**
     * Step 4: Navigate to Markets Page
     * - Click navigation link to markets page
     * - Verify markets page loads with correct elements
     */
    cy.get('[data-testid="nav-markets"]').click();
    cy.url().should('include', '/markets');
    cy.contains('Explore Live Prediction Markets').should('be.visible');

    /**
     * Step 5: Search Functionality
     * - Enter search term in the search input
     * - Verify search results are filtered correctly
     */
    cy.get('[data-testid="markets-search-input"]')
      .should('be.visible')
      .type(MARKET_SEARCH_TERM);

    // Wait for search results to load
    cy.wait('@apiCall');
    cy.get('[data-testid="market-results"]').should('contain', MARKET_SEARCH_TERM);

    /**
     * Step 6: Category Filtering
     * - Apply politics category filter
     * - Verify markets are filtered by selected category
     */
    cy.get('[data-testid="category-filter"]').select('politics');
    cy.wait('@apiCall');

    // Verify filtered results
    cy.get('[data-testid="market-results"]')
      .find('[data-testid="market-category"]')
      .each(($category) => {
        cy.wrap($category).should('contain', 'Politics');
      });

    /**
     * Step 7: Open Order Modal
     * - Click on a market row to open order modal
     * - Verify modal appears with correct market data
     */
    cy.get('[data-testid="market-row"]').first().click();
    cy.get('[data-testid="order-modal"]').should('be.visible');

    // Verify market details in modal
    cy.get('[data-testid="modal-market-title"]').should('be.visible');
    cy.get('[data-testid="modal-market-description"]').should('be.visible');

    /**
     * Step 8: Place Bet Order
     * - Select bet side (Yes/No)
     * - Enter bet amount
     * - Submit the order
     * - Verify order confirmation
     */
    cy.get(`[data-testid="bet-side-${TEST_BET_SIDE.toLowerCase()}"]`).click();
    cy.get('[data-testid="bet-amount-input"]').clear().type(TEST_BET_AMOUNT);

    // Verify amount is correctly entered
    cy.get('[data-testid="bet-amount-input"]').should('have.value', TEST_BET_AMOUNT);

    // Submit order
    cy.get('[data-testid="submit-order-button"]').click();

    // Verify order confirmation
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.contains(`$${TEST_BET_AMOUNT} ${TEST_BET_SIDE} bet placed`).should('be.visible');

    // Close modal
    cy.get('[data-testid="order-modal-close"]').click();
    cy.get('[data-testid="order-modal"]').should('not.be.visible');

    // ========================================
    // PHASE 3: TRADERS PAGE → VIEW POSITIONS
    // ========================================

    /**
     * Step 9: Navigate to Traders Page
     * - Click navigation to traders dashboard
     * - Verify page loads with user data
     */
    cy.get('[data-testid="nav-traders"]').click();
    cy.url().should('include', '/traders');
    cy.contains('Virtual Balance').should('be.visible');

    /**
     * Step 10: Switch to Positions Tab
     * - Click on Positions tab in traders dashboard
     * - Verify positions table loads
     */
    cy.get('[data-testid="tab-positions"]').click();
    cy.get('[data-testid="positions-table"]').should('be.visible');

    /**
     * Step 11: Refresh Positions Data
     * - Click refresh button to manually update positions
     * - Verify SWR mutation triggers data refresh
     */
    cy.get('[data-testid="refresh-positions"]').click();

    // Wait for refresh API call
    cy.wait('@apiCall');
    cy.get('[data-testid="refresh-success-toast"]').should('be.visible');

    // ========================================
    // PHASE 4: PERFORMANCE TAB → ANALYSIS
    // ========================================

    /**
     * Step 12: Switch to Performance Tab
     * - Navigate to performance analysis section
     * - Verify performance components load
     */
    cy.get('[data-testid="tab-performance"]').click();
    cy.get('[data-testid="performance-analytics"]').should('be.visible');

    /**
     * Step 13: Expand Trade History Accordion
     * - Find and expand the first trade history item
     * - Verify detailed trade information is displayed
     */
    cy.get('[data-testid="trade-history-accordion"]').first().click();
    cy.get('[data-testid="trade-details-expanded"]').should('be.visible');

    // Verify trade details are shown
    cy.get('[data-testid="trade-pnl"]').should('be.visible');
    cy.get('[data-testid="trade-entry-price"]').should('be.visible');
    cy.get('[data-testid="trade-resolved-status"]').should('be.visible');

    /**
     * Step 14: Handle Risk Banner
     * - Check if risk banner is present
     * - Dismiss it by clicking the X button
     * - Verify banner disappears
     */
    cy.get('body').then($body => {
      if ($body.find('[data-testid="risk-banner"]').length > 0) {
        // Risk banner is present, dismiss it
        cy.get('[data-testid="risk-banner-close"]').click();
        cy.get('[data-testid="risk-banner"]').should('not.be.visible');
      }
    });

    // ========================================
    // PHASE 5: FINAL VALIDATION
    // ========================================

    /**
     * Step 15: Verify Complete User Journey
     * - Ensure all major components are working
     * - Validate data persistence across navigation
     * - Confirm user can continue using the platform
     */
    cy.get('[data-testid="user-balance"]').should('be.visible');
    cy.get('[data-testid="recent-trades"]').should('have.length.greaterThan', 0);

    // Verify navigation still works after full journey
    cy.get('[data-testid="nav-homepage"]').click();
    cy.url().should('include', '/');
    cy.contains('Trade Prediction Markets').should('be.visible');

    // ========================================
    // TEST COMPLETE - LOG SUCCESS
    // ========================================

    cy.log('✅ Full user flow test completed successfully!');
    cy.log(`📊 Test covered: Homepage → Auth → Markets → Order → Traders → Performance`);
  });

  // Additional test scenarios can be added here
  it('should handle authentication errors gracefully', () => {
    // Test authentication failure scenarios
    cy.visit('/');
    cy.get('[data-testid="auth-button"]').click();

    // Simulate authentication failure
    cy.window().then((win) => {
      win.localStorage.setItem('privy-auth-error', 'connection_failed');
    });

    cy.get('[data-testid="auth-error-message"]').should('be.visible');
    cy.contains('Authentication failed').should('be.visible');
  });

  it('should handle market data loading states', () => {
    // Test loading states and error handling
    cy.visit('/markets');

    // Verify loading indicators
    cy.get('[data-testid="markets-loading"]').should('be.visible');

    // Wait for data to load
    cy.wait('@apiCall');
    cy.get('[data-testid="markets-loading"]').should('not.be.visible');
    cy.get('[data-testid="market-results"]').should('be.visible');
  });
});

/**
 * Test Data and Mocks Configuration
 *
 * For consistent testing, ensure the following test data exists:
 * - At least one active market with "election" in the title
 * - Politics category markets available
 * - Mock user authentication setup
 * - Sample trade history data
 *
 * Environment Variables Required:
 * - CYPRESS_BASE_URL: Base URL for the application
 * - CYPRESS_TEST_USER: Test user credentials
 * - CYPRESS_TEST_WALLET: Test wallet address
 */

/**
 * Common Test Utilities
 *
 * These helper functions can be moved to cypress/support/commands.js
 * for reuse across multiple test files.
 */

// Custom command for authentication
Cypress.Commands.add('login', (user) => {
  cy.get('[data-testid="auth-button"]').click();
  cy.get('[data-testid="privy-modal"]').should('be.visible');

  // Mock successful authentication
  cy.window().then((win) => {
    win.localStorage.setItem('privy-authenticated', 'true');
    win.localStorage.setItem('privy-user-id', user.id);
    win.localStorage.setItem('privy-wallet-address', user.wallet);
  });

  cy.get('[data-testid="privy-modal-close"]').click();
});

// Custom command for placing orders
Cypress.Commands.add('placeBet', (amount, side) => {
  cy.get(`[data-testid="bet-side-${side.toLowerCase()}"]`).click();
  cy.get('[data-testid="bet-amount-input"]').clear().type(amount);
  cy.get('[data-testid="submit-order-button"]').click();
  cy.get('[data-testid="order-confirmation"]').should('be.visible');
});
