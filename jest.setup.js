/**
 * Jest Setup File
 *
 * Global setup for Jest tests including:
 * - React Testing Library configuration
 * - Custom matchers from jest-dom
 * - Global test utilities
 * - Mock implementations
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    this.unobserve = jest.fn();
  }
};

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }

  send() {}
  close() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.location
delete global.window.location;
global.window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn(),
};

// Mock window.scrollTo
global.window.scrollTo = jest.fn();

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Suppress console warnings during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global test utilities
global.createMockMarket = (overrides = {}) => ({
  id: 'test-market-123',
  title: 'Test Market Title',
  description: 'Test market description',
  currentPrice: 0.65,
  volume: 1500000,
  endDate: '2024-12-31T23:59:59Z',
  ...overrides,
});

global.createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  wallet: '0x1234567890123456789012345678901234567890',
  ...overrides,
});

global.createMockTrade = (overrides = {}) => ({
  id: 'test-trade-123',
  marketId: 'test-market-123',
  marketTitle: 'Test Market',
  side: 'Yes',
  amount: 100,
  entryPrice: 0.65,
  pnl: 25,
  status: 'resolved',
  ...overrides,
});

// Custom Jest matchers
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

  toHaveClass(received, className) {
    const pass = received.classList.contains(className);

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass,
    };
  },
});
