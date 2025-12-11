// Jest setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing';
process.env.LOG_LEVEL = 'error'; // Reduce noise in test output

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock email service to prevent actual emails during tests
jest.mock('../src/services/emailService', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  isReady: jest.fn().mockReturnValue(false),
  sendValidationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendQuotaWarningEmail: jest.fn().mockResolvedValue(true),
}));

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};
