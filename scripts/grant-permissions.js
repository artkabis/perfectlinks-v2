#!/usr/bin/env node
/**
 * Grant PostgreSQL Permissions
 *
 * This script grants all necessary permissions to the database user
 * for the Perfect Links API to function correctly.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function grantPermissions() {
  // Read the grants.sql file
  const grantsPath = path.join(__dirname, '../database/grants.sql');
  let grantsSql = fs.readFileSync(grantsPath, 'utf8');

  // Get database user from environment
  const dbUser = process.env.DB_USER;

  if (!dbUser) {
    console.error('❌ Error: DB_USER not found in .env file');
    console.error('Please ensure your .env file has DB_USER defined');
    process.exit(1);
  }

  console.log(`\n🔐 Granting permissions to user: ${dbUser}\n`);

  // Replace placeholder with actual user
  grantsSql = grantsSql.replace(/VOTRE_UTILISATEUR_DB/g, dbUser);

  // Create PostgreSQL client
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // Execute grants
    await client.query(grantsSql);
    console.log('✅ Permissions granted successfully\n');

    // Verify permissions on key tables
    console.log('📊 Verifying permissions...\n');

    const tables = ['users', 'user_sessions', 'user_usage', 'usage_logs'];

    for (const table of tables) {
      const result = await client.query(`
        SELECT privilege_type
        FROM information_schema.table_privileges
        WHERE table_name = $1 AND grantee = $2
        ORDER BY privilege_type
      `, [table, dbUser]);

      const privileges = result.rows.map(r => r.privilege_type).join(', ');
      console.log(`  ${table}: ${privileges || 'No privileges found'}`);
    }

    console.log('\n✅ Permission verification complete\n');
    console.log('You can now run your application with proper permissions.');

  } catch (error) {
    console.error('❌ Error granting permissions:', error.message);
    console.error('\nIf you see a "permission denied" error, you may need to:');
    console.error('1. Run this script as a database superuser (postgres)');
    console.error('2. Or contact your hosting provider to grant permissions');
    console.error('3. Or manually run the grants.sql file via phpPgAdmin\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
grantPermissions();
