/**
 * PolyProp Component Tests
 *
 * Comprehensive Jest testing suite for React components using:
 * - @testing-library/react for component rendering and interaction
 * - @testing-library/jest-dom for extended matchers
 * - Jest for test framework and mocking
 *
 * Tests cover critical user flows and component behaviors.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock dependencies to isolate component testing
jest.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    ready: true,
    authenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Import components after mocks are set up
import AuthButton from '../app/components/AuthButton';
import OrderModal from '../app/components/OrderModal';

/**
 * AUTHENTICATION BUTTON TESTS
 *
 * Tests the authentication flow and modal interactions
 */
describe('AuthButton Component', () => {
  const mockProps = {
    onAuthSuccess: jest.fn(),
    onAuthError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Case 1: Initial Rendering
   * - Verifies component renders correctly in unauthenticated state
   * - Checks for proper button text and accessibility
   */
  test('renders authentication button correctly when unauthenticated', () => {
    render(<AuthButton {...mockProps} />);

    // Verify button is present and has correct text
    const authButton = screen.getByRole('button', { name: /connect wallet/i });
    expect(authButton).toBeInTheDocument();

    // Verify button styling and accessibility
    expect(authButton).toHaveClass('connect-orb');
    expect(authButton).toHaveAttribute('aria-label', 'Connect wallet');
  });

  /**
   * Test Case 2: Click Handler - Modal Opening
   * - Tests that clicking the button triggers authentication flow
   * - Verifies modal state changes correctly
   */
  test('opens Privy authentication modal when clicked', async () => {
    // Mock Privy modal component
    const mockPrivyModal = jest.fn();
    jest.doMock('@privy-io/react-auth', () => ({
      usePrivy: () => ({
        ready: true,
        authenticated: false,
        user: null,
        login: jest.fn(() => Promise.resolve()),
      }),
      PrivyModal: mockPrivyModal,
    }));

    render(<AuthButton {...mockProps} />);

    const authButton = screen.getByRole('button', { name: /connect wallet/i });

    // Click the authentication button
    fireEvent.click(authButton);

    // Verify login function was called
    await waitFor(() => {
      expect(mockProps.onAuthSuccess).toHaveBeenCalled();
    });

    // Verify modal becomes visible (this would be tested with integration tests)
    expect(mockPrivyModal).toHaveBeenCalled();
  });

  /**
   * Test Case 3: Loading States
   * - Tests component behavior during authentication loading
   * - Verifies loading indicators are displayed
   */
  test('shows loading state during authentication', () => {
    // Mock loading state
    jest.doMock('@privy-io/react-auth', () => ({
      usePrivy: () => ({
        ready: false, // Not ready yet
        authenticated: false,
        user: null,
        login: jest.fn(),
      }),
    }));

    render(<AuthButton {...mockProps} />);

    // Verify loading text is displayed
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Verify button is disabled during loading
    const authButton = screen.getByRole('button');
    expect(authButton).toBeDisabled();
  });

  /**
   * Test Case 4: Error Handling
   * - Tests error scenarios and user feedback
   * - Verifies error messages are displayed appropriately
   */
  test('handles authentication errors gracefully', async () => {
    const mockLogin = jest.fn(() => Promise.reject(new Error('Auth failed')));

    jest.doMock('@privy-io/react-auth', () => ({
      usePrivy: () => ({
        ready: true,
        authenticated: false,
        user: null,
        login: mockLogin,
      }),
    }));

    render(<AuthButton {...mockProps} />);

    const authButton = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(authButton);

    // Verify error callback is called
    await waitFor(() => {
      expect(mockProps.onAuthError).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });
  });

  /**
   * Test Case 5: Accessibility Compliance
   * - Tests ARIA labels and keyboard navigation
   * - Ensures component is accessible to screen readers
   */
  test('meets accessibility standards', () => {
    render(<AuthButton {...mockProps} />);

    const authButton = screen.getByRole('button');

    // Verify ARIA attributes
    expect(authButton).toHaveAttribute('aria-label');
    expect(authButton).toHaveAttribute('aria-describedby');

    // Verify keyboard navigation works
    authButton.focus();
    expect(document.activeElement).toBe(authButton);
  });
});

/**
 * ORDER MODAL TESTS
 *
 * Tests the order placement flow and form validation
 */
describe('OrderModal Component', () => {
  const mockMarket = {
    id: 'test-market-123',
    title: 'Will BTC reach $100k in 2024?',
    description: 'Bitcoin price prediction market',
    currentPrice: 0.65,
    volume: 1500000,
  };

  const mockProps = {
    market: mockMarket,
    isOpen: true,
    onClose: jest.fn(),
    onOrderPlaced: jest.fn(),
  };

  const mockApiOrder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, orderId: '12345' }),
      })
    );

    // Mock the API order function
    mockApiOrder.mockResolvedValue({ success: true });
  });

  /**
   * Test Case 1: Modal Rendering
   * - Verifies modal displays correctly with market data
   * - Tests all required form elements are present
   */
  test('renders order modal with market details', () => {
    render(<OrderModal {...mockProps} />);

    // Verify modal is visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify market information is displayed
    expect(screen.getByText(mockMarket.title)).toBeInTheDocument();
    expect(screen.getByText(mockMarket.description)).toBeInTheDocument();

    // Verify form elements are present
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
  });

  /**
   * Test Case 2: Form Validation
   * - Tests amount input validation
   * - Verifies error messages for invalid inputs
   */
  test('validates order amount correctly', async () => {
    render(<OrderModal {...mockProps} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /place order/i });

    // Test empty amount
    fireEvent.change(amountInput, { target: { value: '' } });
    expect(submitButton).toBeDisabled();

    // Test invalid amount (negative)
    fireEvent.change(amountInput, { target: { value: '-100' } });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();

    // Test valid amount
    fireEvent.change(amountInput, { target: { value: '100' } });
    expect(submitButton).not.toBeDisabled();
  });

  /**
   * Test Case 3: Bet Side Selection
   * - Tests Yes/No button selection
   * - Verifies selected state is maintained
   */
  test('handles bet side selection correctly', () => {
    render(<OrderModal {...mockProps} />);

    const yesButton = screen.getByRole('button', { name: /yes/i });
    const noButton = screen.getByRole('button', { name: /no/i });

    // Initially no side selected
    expect(yesButton).not.toHaveClass('selected');
    expect(noButton).not.toHaveClass('selected');

    // Select Yes
    fireEvent.click(yesButton);
    expect(yesButton).toHaveClass('selected');
    expect(noButton).not.toHaveClass('selected');

    // Select No (should deselect Yes)
    fireEvent.click(noButton);
    expect(yesButton).not.toHaveClass('selected');
    expect(noButton).toHaveClass('selected');
  });

  /**
   * Test Case 4: Order Submission
   * - Tests complete order placement flow
   * - Verifies API calls and success handling
   */
  test('submits order successfully', async () => {
    render(<OrderModal {...mockProps} />);

    // Fill out the form
    const amountInput = screen.getByLabelText(/amount/i);
    const yesButton = screen.getByRole('button', { name: /yes/i });
    const submitButton = screen.getByRole('button', { name: /place order/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(yesButton);

    // Verify form is valid
    expect(submitButton).not.toBeDisabled();

    // Submit the order
    fireEvent.click(submitButton);

    // Verify API was called with correct data
    await waitFor(() => {
      expect(mockApiOrder).toHaveBeenCalledWith({
        marketId: mockMarket.id,
        amount: 100,
        side: 'yes',
        marketData: mockMarket,
      });
    });

    // Verify success callback
    expect(mockProps.onOrderPlaced).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: '12345',
        success: true,
      })
    );
  });

  /**
   * Test Case 5: Order Submission Error Handling
   * - Tests error scenarios during order placement
   * - Verifies error messages are displayed
   */
  test('handles order submission errors', async () => {
    // Mock API failure
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<OrderModal {...mockProps} />);

    // Fill and submit form
    const amountInput = screen.getByLabelText(/amount/i);
    const yesButton = screen.getByRole('button', { name: /yes/i });
    const submitButton = screen.getByRole('button', { name: /place order/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(yesButton);
    fireEvent.click(submitButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to place order/i)).toBeInTheDocument();
    });

    // Verify modal stays open on error
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  /**
   * Test Case 6: Modal Close Functionality
   * - Tests modal close button and overlay click
   * - Verifies close callback is called
   */
  test('closes modal correctly', () => {
    render(<OrderModal {...mockProps} />);

    // Test close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalled();

    // Test overlay click (would require additional setup for overlay element)
    // This would be tested in integration tests
  });

  /**
   * Test Case 7: Loading States
   * - Tests loading indicators during order submission
   * - Verifies UI feedback during async operations
   */
  test('shows loading state during order submission', async () => {
    // Mock slow API response
    global.fetch = jest.fn(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }), 2000)
      )
    );

    render(<OrderModal {...mockProps} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const yesButton = screen.getByRole('button', { name: /yes/i });
    const submitButton = screen.getByRole('button', { name: /place order/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(yesButton);
    fireEvent.click(submitButton);

    // Verify loading state
    expect(screen.getByText(/placing order/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/placing order/i)).not.toBeInTheDocument();
    });
  });
});

/**
 * UTILITY FUNCTIONS AND HELPERS
 *
 * Shared test utilities and setup functions
 */

/**
 * Test Data Factory
 * Creates consistent test data for component testing
 */
const createMockMarket = (overrides = {}) => ({
  id: 'test-market-123',
  title: 'Test Market Title',
  description: 'Test market description',
  currentPrice: 0.65,
  volume: 1500000,
  endDate: '2024-12-31T23:59:59Z',
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  wallet: '0x1234567890123456789012345678901234567890',
  ...overrides,
});

/**
 * Custom Test Matchers
 * Extended Jest matchers for component testing
 */
expect.extend({
  toBeVisibleInModal(received) {
    const pass = received &&
                 received.closest('[role="dialog"]') &&
                 !received.closest('[aria-hidden="true"]');

    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be visible in modal`,
      pass,
    };
  },

  toHaveValidForm(received) {
    const inputs = received.querySelectorAll('input[required]');
    const validInputs = Array.from(inputs).filter(input =>
      input.checkValidity()
    );

    const pass = validInputs.length === inputs.length;

    return {
      message: () =>
        `expected form ${pass ? 'not ' : ''}to have all valid inputs`,
      pass,
    };
  },
});

/**
 * TEST CONFIGURATION AND SETUP
 *
 * Jest configuration and global test setup
 */

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Set up global test environment
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});

/**
 * PERFORMANCE TESTING UTILITIES
 *
 * Optional performance tests for components
 */
describe('Performance Tests', () => {
  test('AuthButton renders within performance budget', () => {
    const startTime = performance.now();

    render(<AuthButton onAuthSuccess={jest.fn()} onAuthError={jest.fn()} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Performance budget: 100ms max render time
    expect(renderTime).toBeLessThan(100);
  });

  test('OrderModal handles large datasets efficiently', () => {
    const largeMarket = createMockMarket({
      title: 'A'.repeat(1000), // Large title
      description: 'B'.repeat(5000), // Large description
    });

    const startTime = performance.now();

    render(<OrderModal market={largeMarket} isOpen={true} onClose={jest.fn()} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Performance budget: 200ms for complex components
    expect(renderTime).toBeLessThan(200);
  });
});

/**
 * SNAPSHOT TESTS
 *
 * Visual regression testing using Jest snapshots
 */
describe('Component Snapshots', () => {
  test('AuthButton matches snapshot', () => {
    const { container } = render(<AuthButton onAuthSuccess={jest.fn()} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('OrderModal matches snapshot', () => {
    const { container } = render(
      <OrderModal
        market={createMockMarket()}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

/**
 * ACCESSIBILITY TESTS
 *
 * WCAG compliance and accessibility testing
 */
describe('Accessibility Tests', () => {
  test('AuthButton has proper ARIA attributes', () => {
    render(<AuthButton onAuthSuccess={jest.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-describedby');
  });

  test('OrderModal is keyboard accessible', () => {
    render(<OrderModal market={createMockMarket()} isOpen={true} onClose={jest.fn()} />);

    // Test tab navigation
    const firstFocusableElement = screen.getByRole('textbox'); // Amount input
    firstFocusableElement.focus();
    expect(document.activeElement).toBe(firstFocusableElement);

    // Tab to next element
    fireEvent.keyDown(firstFocusableElement, { key: 'Tab' });
    // This would need more complex setup for full keyboard navigation testing
  });
});

/**
 * INTEGRATION TESTS
 *
 * Tests that verify component interactions work together
 */
describe('Component Integration', () => {
  test('AuthButton and OrderModal work together in user flow', async () => {
    // This would test the complete authentication → trading flow
    // Requires more complex setup and mocking

    // Mock successful authentication
    const mockLogin = jest.fn(() => Promise.resolve());

    jest.doMock('@privy-io/react-auth', () => ({
      usePrivy: () => ({
        ready: true,
        authenticated: true,
        user: createMockUser(),
        login: mockLogin,
      }),
    }));

    // Render components together
    render(
      <div>
        <AuthButton onAuthSuccess={jest.fn()} />
        <OrderModal
          market={createMockMarket()}
          isOpen={true}
          onClose={jest.fn()}
        />
      </div>
    );

    // Verify both components render correctly when authenticated
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
