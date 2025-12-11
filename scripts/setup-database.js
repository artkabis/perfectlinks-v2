require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, closePool } = require('../config/database');
const logger = require('../src/utils/logger');

/**
 * Setup database by executing the schema SQL file
 */
async function setupDatabase() {
  try {
    console.log('🔧 Setting up Perfect Links database...\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema.sql...');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database tables created successfully');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check functions
    const functionsResult = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
    `);

    if (functionsResult.rows.length > 0) {
      console.log('\n⚙️  Created functions:');
      functionsResult.rows.forEach((row) => {
        console.log(`   ✓ ${row.routine_name}()`);
      });
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm start');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run setup
setupDatabase();
