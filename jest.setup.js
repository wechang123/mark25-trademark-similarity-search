require('@testing-library/jest-dom')

// Mock global console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock process.env if needed
process.env.NODE_ENV = 'test'

// Mock fetch globally
global.fetch = jest.fn()

// Setup any other global mocks here