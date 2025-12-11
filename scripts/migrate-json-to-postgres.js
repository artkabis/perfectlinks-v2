require('dotenv').config();
const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');
const { pool, closePool, transaction } = require('../config/database');
const logger = require('../src/utils/logger');

const USERS_FILE_PATH = process.env.USERS_PATH_ENCRYPT || './data/users.encrypted.json';
const JWT_SECRET_JSON = process.env.JWT_SECRET_JSON;

/**
 * Decrypt the JSON user file
 */
function decryptUserFile() {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      throw new Error(`User file not found: ${USERS_FILE_PATH}`);
    }

    if (!JWT_SECRET_JSON) {
      throw new Error('JWT_SECRET_JSON not configured in .env');
    }

    const encryptedData = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    const decrypted = CryptoJS.AES.decrypt(encryptedData, JWT_SECRET_JSON).toString(
      CryptoJS.enc.Utf8
    );

    if (!decrypted) {
      throw new Error('Failed to decrypt user file - check JWT_SECRET_JSON');
    }

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Failed to read/decrypt user file: ${error.message}`);
  }
}

/**
 * Migrate a single user to PostgreSQL
 */
async function migrateUser(client, userData) {
  // Extract user data
  const {
    username,
    email,
    password: passwordHash,
    plan = 'free',
    validated = false,
    createdAt,
    lastLogin,
  } = userData;

  // Insert user
  const userResult = await client.query(
    `
    INSERT INTO users (username, email, password_hash, plan, email_validated, status, created_at, last_login_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (email) DO UPDATE
    SET username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        plan = EXCLUDED.plan,
        email_validated = EXCLUDED.email_validated,
        last_login_at = EXCLUDED.last_login_at
    RETURNING user_id, email
  `,
    [
      username,
      email.toLowerCase(),
      passwordHash,
      plan,
      validated,
      validated ? 'active' : 'pending',
      createdAt ? new Date(createdAt) : new Date(),
      lastLogin ? new Date(lastLogin) : null,
    ]
  );

  return userResult.rows[0];
}

/**
 * Migrate usage data for a user
 */
async function migrateUsage(client, userId, usageData) {
  const { requestsMade = 0, requestsLimit = 100, periodStart, periodEnd } = usageData || {};

  await client.query(
    `
    INSERT INTO user_usage (user_id, requests_made, requests_limit, period_start, period_end)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) DO UPDATE
    SET requests_made = EXCLUDED.requests_made,
        requests_limit = EXCLUDED.requests_limit,
        period_start = EXCLUDED.period_start,
        period_end = EXCLUDED.period_end
  `,
    [
      userId,
      requestsMade,
      requestsLimit,
      periodStart ? new Date(periodStart) : new Date(),
      periodEnd ? new Date(periodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ]
  );
}

/**
 * Main migration function
 */
async function migrateToPostgreSQL() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n');

  try {
    // Check if database is ready
    const tablesExist = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
    `);

    if (parseInt(tablesExist.rows[0].count, 10) !== 4) {
      console.error('❌ Database tables not found. Please run: npm run db:setup');
      process.exit(1);
    }

    // Decrypt and read JSON file
    console.log('📄 Reading encrypted JSON file...');
    const jsonData = decryptUserFile();

    if (!jsonData || !Array.isArray(jsonData)) {
      throw new Error('Invalid JSON data format');
    }

    console.log(`✅ Found ${jsonData.length} users in JSON file\n`);

    // Migrate users in transaction
    let migratedCount = 0;
    let errorCount = 0;

    for (const userData of jsonData) {
      try {
        await transaction(async (client) => {
          // Migrate user
          const user = await migrateUser(client, userData);
          console.log(`✓ Migrated user: ${user.email}`);

          // Migrate usage if available
          if (userData.usage) {
            await migrateUsage(client, user.user_id, userData.usage);
          }

          migratedCount++;
        });
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate ${userData.email}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} users`);
    }
    console.log('═'.repeat(60));

    // Verify migration
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n📈 Total users in database: ${userCount.rows[0].count}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify the migrated data: npm run migrate:check');
    console.log('   2. Backup your JSON file if not already done');
    console.log('   3. Start using the new PostgreSQL backend: npm start');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure USERS_PATH_ENCRYPT points to your encrypted JSON file');
    console.error('   2. Verify JWT_SECRET_JSON matches the encryption key used');
    console.error('   3. Check that the JSON file format is correct');
    console.error('   4. Ensure database tables exist (npm run db:setup)');
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migration
if (require.main === module) {
  migrateToPostgreSQL();
}

module.exports = { migrateToPostgreSQL };
