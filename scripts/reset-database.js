require('dotenv').config();
const readline = require('readline');
const { pool, closePool } = require('../config/database');

/**
 * Reset database by dropping and recreating all tables
 */
async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!\n');

    // Create readline interface for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to continue? (yes/no): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Database reset cancelled');
      process.exit(0);
    }

    console.log('\n🗑️  Dropping existing tables and types...');

    // Drop tables in correct order (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS usage_logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_usage CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    // Drop types
    await pool.query('DROP TYPE IF EXISTS user_plan_type CASCADE');
    await pool.query('DROP TYPE IF EXISTS user_status_type CASCADE');

    console.log('✅ Old tables dropped');

    console.log('\n📄 Recreating tables from schema...');

    // Re-run setup script
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Tables recreated successfully');

    // Verify
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Current tables:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n✅ Database reset completed successfully!');
  } catch (error) {
    console.error('\n❌ Database reset failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run reset
resetDatabase();
