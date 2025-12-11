const request = require('supertest');
const app = require('../server');
const { pool, closePool } = require('../config/database');

describe('Authentication API', () => {
  // Close database connections after all tests
  afterAll(async () => {
    await closePool();
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'testuser123',
        email: 'test123@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('userId');
      expect(response.body.user.email).toBe(newUser.email.toLowerCase());
      expect(response.body.user.username).toBe(newUser.username.toLowerCase());
      expect(response.body.user.plan).toBe('free');
      expect(response.body.user.status).toBe('pending');

      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', [newUser.email.toLowerCase()]);
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/register')
        .send(invalidUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/register')
        .send(weakPasswordUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject duplicate email', async () => {
      const user = {
        username: 'testuser456',
        email: 'duplicate@example.com',
        password: 'TestPass123!',
      };

      // Register first time
      await request(app).post('/api/register').send(user).expect(201);

      // Try to register again
      const response = await request(app)
        .post('/api/register')
        .send(user)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');

      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', [user.email.toLowerCase()]);
    });
  });

  describe('POST /api/login', () => {
    const testUser = {
      username: 'logintest',
      email: 'logintest@example.com',
      password: 'TestPass123!',
    };

    beforeAll(async () => {
      // Create a validated test user
      await request(app).post('/api/register').send(testUser);

      // Manually validate the user
      await pool.query(
        "UPDATE users SET email_validated = TRUE, status = 'active' WHERE email = $1",
        [testUser.email.toLowerCase()]
      );
    });

    afterAll(async () => {
      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', [testUser.email.toLowerCase()]);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.tokenType).toBe('Bearer');
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
