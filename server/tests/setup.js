// Test setup file
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';

// Global test setup can go here
global.beforeAll(() => {
  // Setup before all tests
});

global.afterAll(() => {
  // Cleanup after all tests
});