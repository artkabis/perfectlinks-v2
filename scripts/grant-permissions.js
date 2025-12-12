#!/usr/bin/env node
/**
 * Grant PostgreSQL Permissions
 *
 * This script grants all necessary permissions to the database user
 * for the Perfect Links API to function correctly.
 */

const { Client } = require('pg');
require('dotenv').config();

async function grantPermissions() {
  const dbUser = process.env.DB_USER;

  if (!dbUser) {
    console.error('❌ Error: DB_USER not found in .env file');
    console.error('Please ensure your .env file has DB_USER defined');
    process.exit(1);
  }

  console.log(`\n🔐 Checking permissions for user: ${dbUser}\n`);

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get the actual current user (PostgreSQL may normalize the case)
    const currentUserResult = await client.query('SELECT current_user');
    const currentUser = currentUserResult.rows[0].current_user;

    console.log(`📋 Current PostgreSQL user: ${currentUser}`);

    if (currentUser !== dbUser.toLowerCase() && currentUser !== dbUser) {
      console.log(`\n⚠️  WARNING: User name mismatch!`);
      console.log(`   .env DB_USER: ${dbUser}`);
      console.log(`   Actual user:  ${currentUser}`);
      console.log(`\n💡 TIP: Update your .env file to use: DB_USER=${currentUser}\n`);
    }

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
      ORDER BY tablename
    `);

    if (tablesResult.rows.length === 0) {
      console.log('\n⚠️  No tables found. Please run: npm run db:setup\n');
      process.exit(1);
    }

    console.log('\n📊 Table ownership:');
    let needsGrants = false;

    for (const table of tablesResult.rows) {
      const isOwner = table.tableowner === currentUser;
      console.log(`   ${table.tablename.padEnd(20)} owner: ${table.tableowner} ${isOwner ? '✅' : '❌'}`);
      if (!isOwner) needsGrants = true;
    }

    if (!needsGrants) {
      console.log('\n✅ You are the owner of all tables!');
      console.log('   As owner, you already have full permissions (SELECT, INSERT, UPDATE, DELETE)');
      console.log('   No grants needed.\n');
      console.log('💡 Your application should work correctly now.');
      console.log('   If you still see permission errors, check database/PERMISSIONS.md\n');
      return;
    }

    // If we reach here, user is not owner of all tables
    console.log('\n⚠️  You are NOT the owner of some tables.');
    console.log('   Attempting to grant permissions...\n');

    const tables = ['users', 'user_sessions', 'user_usage', 'usage_logs'];
    const sequences = ['users_id_seq', 'user_sessions_id_seq', 'user_usage_id_seq', 'usage_logs_id_seq'];

    // Quote the username to preserve case sensitivity
    const quotedUser = `"${currentUser}"`;

    // Grant permissions on tables
    for (const table of tables) {
      try {
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${table} TO ${quotedUser}`);
        console.log(`✅ Granted permissions on ${table}`);
      } catch (err) {
        console.log(`⚠️  Failed to grant on ${table}: ${err.message}`);
      }
    }

    // Grant permissions on sequences
    for (const seq of sequences) {
      try {
        await client.query(`GRANT USAGE, SELECT ON SEQUENCE ${seq} TO ${quotedUser}`);
        console.log(`✅ Granted permissions on ${seq}`);
      } catch (err) {
        console.log(`⚠️  Failed to grant on ${seq}: ${err.message}`);
      }
    }

    // Grant execute on functions
    const functions = [
      'update_updated_at_column()',
      'initialize_user_usage()',
      'update_usage_limit_on_plan_change()',
      'cleanup_expired_sessions()',
      'reset_expired_quotas()'
    ];

    for (const func of functions) {
      try {
        await client.query(`GRANT EXECUTE ON FUNCTION ${func} TO ${quotedUser}`);
        console.log(`✅ Granted EXECUTE on ${func}`);
      } catch (err) {
        console.log(`⚠️  Failed to grant on ${func}: ${err.message}`);
      }
    }

    console.log('\n✅ Permission granting complete\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('1. Run: npm run db:diagnose (to check your setup)');
    console.error('2. Make sure you ran: npm run db:setup');
    console.error('3. Check that your .env DB_USER matches the actual database user');
    console.error('4. Contact your hosting provider for help with permissions\n');
    console.error('📖 See database/PERMISSIONS.md for detailed troubleshooting\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
grantPermissions();
