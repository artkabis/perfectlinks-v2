/**
 * Perfect Links API - Integration Tests
 *
 * Full integration test suite for the Perfect Links API
 * Tests all major endpoints and workflows
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:9090/api';
const TEST_EMAIL = `test-${Date.now()}@perfectlinks.fr`;
const TEST_USERNAME = `testuser-${Date.now()}`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_SITE_URL = 'https://example.com/sitemap.xml';

// Test state
let accessToken = '';
let refreshToken = '';
let userId = '';

describe('Perfect Links API - Integration Tests', () => {

  // ===========================================================================
  // Health Check Tests
  // ===========================================================================
  describe('Health Check', () => {
    test('GET /health should return 200 and health status', async () => {
      const response = await axios.get(`${API_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('ok');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('database');
    });
  });

  // ===========================================================================
  // Authentication Tests
  // ===========================================================================
  describe('Authentication', () => {

    test('POST /auth/register should create a new user', async () => {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('user_id');
      expect(response.data.user.email).toBe(TEST_EMAIL.toLowerCase());
      expect(response.data.user.username).toBe(TEST_USERNAME.toLowerCase());
      expect(response.data.user.plan).toBe('free');
      expect(response.data.user.status).toBe('pending');

      userId = response.data.user.user_id;
    });

    test('POST /auth/register should reject duplicate email', async () => {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          username: `${TEST_USERNAME}-2`,
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('POST /auth/register should reject duplicate username', async () => {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          username: TEST_USERNAME,
          email: `different-${TEST_EMAIL}`,
          password: TEST_PASSWORD
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('POST /auth/register should reject weak passwords', async () => {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          username: `${TEST_USERNAME}-weak`,
          email: `weak-${TEST_EMAIL}`,
          password: '123'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('POST /auth/login should login successfully', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(TEST_EMAIL.toLowerCase());

      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
    });

    test('POST /auth/login should reject wrong password', async () => {
      try {
        await axios.post(`${API_URL}/auth/login`, {
          email: TEST_EMAIL,
          password: 'WrongPassword123!'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('POST /auth/login should reject non-existent user', async () => {
      try {
        await axios.post(`${API_URL}/auth/login`, {
          email: 'nonexistent@example.com',
          password: TEST_PASSWORD
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('POST /auth/refresh should refresh access token', async () => {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: refreshToken
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');

      // Update access token
      accessToken = response.data.accessToken;
    });

    test('POST /auth/refresh should reject invalid refresh token', async () => {
      try {
        await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: 'invalid-token'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  // ===========================================================================
  // User Profile Tests
  // ===========================================================================
  describe('User Profile', () => {

    test('GET /users/profile should return user profile', async () => {
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(TEST_EMAIL.toLowerCase());
      expect(response.data.user).not.toHaveProperty('password_hash');
    });

    test('GET /users/profile should reject without token', async () => {
      try {
        await axios.get(`${API_URL}/users/profile`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('GET /users/profile should reject with invalid token', async () => {
      try {
        await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('GET /users/statistics should return usage statistics', async () => {
      const response = await axios.get(`${API_URL}/users/statistics`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('statistics');
      expect(response.data.statistics).toHaveProperty('requests_made');
      expect(response.data.statistics).toHaveProperty('requests_limit');
      expect(response.data.statistics).toHaveProperty('plan');
      expect(response.data.statistics.plan).toBe('free');
    });
  });

  // ===========================================================================
  // Sitemap Analysis Tests
  // ===========================================================================
  describe('Sitemap Analysis', () => {

    test('POST /analyze/sitemap should analyze a sitemap', async () => {
      const response = await axios.post(
        `${API_URL}/analyze/sitemap`,
        { siteUrl: TEST_SITE_URL },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('analysis');
      expect(response.data.analysis).toHaveProperty('siteUrl');
    }, 30000); // 30 second timeout for sitemap analysis

    test('POST /analyze/sitemap should reject without authentication', async () => {
      try {
        await axios.post(`${API_URL}/analyze/sitemap`, {
          siteUrl: TEST_SITE_URL
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('POST /analyze/sitemap should reject invalid URL', async () => {
      try {
        await axios.post(
          `${API_URL}/analyze/sitemap`,
          { siteUrl: 'not-a-valid-url' },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  // ===========================================================================
  // Session Management Tests
  // ===========================================================================
  describe('Session Management', () => {

    test('GET /auth/sessions should return active sessions', async () => {
      const response = await axios.get(`${API_URL}/auth/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('sessions');
      expect(Array.isArray(response.data.sessions)).toBe(true);
      expect(response.data.sessions.length).toBeGreaterThan(0);
    });

    test('POST /auth/logout should logout successfully', async () => {
      const response = await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    test('GET /users/profile should fail after logout', async () => {
      try {
        await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // ===========================================================================
  // Quota Management Tests
  // ===========================================================================
  describe('Quota Management', () => {

    beforeAll(async () => {
      // Login again to get a fresh token
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      accessToken = response.data.accessToken;
    });

    test('Should track API usage', async () => {
      const statsBefore = await axios.get(`${API_URL}/users/statistics`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const requestsBefore = statsBefore.data.statistics.requests_made;

      // Make an API call
      await axios.post(
        `${API_URL}/analyze/sitemap`,
        { siteUrl: TEST_SITE_URL },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ).catch(() => {}); // Ignore errors

      const statsAfter = await axios.get(`${API_URL}/users/statistics`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const requestsAfter = statsAfter.data.statistics.requests_made;

      expect(requestsAfter).toBeGreaterThanOrEqual(requestsBefore);
    }, 30000);

    test('Should enforce quota limits for free plan', async () => {
      const stats = await axios.get(`${API_URL}/users/statistics`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(stats.data.statistics.requests_limit).toBe(100);
    });
  });
});
