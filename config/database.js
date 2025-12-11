const { Pool } = require('pg');
const logger = require('../src/utils/logger');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'perfectlinks_db',
  user: process.env.DB_USER || 'perfectlinks_user',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
};

// Create the connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected successfully at ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}...`);
    }

    return result;
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100),
      params: params.length,
    });
    throw error;
  }
};

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Async function that receives a client
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get a client from the pool for manual transaction management
 * @returns {Promise<PoolClient>} Database client
 */
const getClient = async () => {
  return pool.connect();
};

/**
 * Close all connections in the pool
 * @returns {Promise<void>}
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

/**
 * Check if database tables exist
 * @returns {Promise<boolean>}
 */
const checkTablesExist = async () => {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
    `);
    return parseInt(result.rows[0].count, 10) === 4;
  } catch (error) {
    logger.error('Error checking tables:', error);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  testConnection,
  closePool,
  checkTablesExist,
};
