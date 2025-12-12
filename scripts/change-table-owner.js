#!/usr/bin/env node
/**
 * Change Table Ownership
 *
 * This script changes the ownership of all Perfect Links API tables
 * to the current database user specified in .env
 */

const { Client } = require('pg');
require('dotenv').config();

async function changeOwnership() {
  const dbUser = process.env.DB_USER;

  if (!dbUser) {
    console.error('❌ Error: DB_USER not found in .env file');
    process.exit(1);
  }

  console.log(`\n🔄 Changing table ownership to: ${dbUser}\n`);

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

    // Get current user
    const currentUserResult = await client.query('SELECT current_user');
    const currentUser = currentUserResult.rows[0].current_user;
    console.log(`📋 Current user: ${currentUser}`);

    // Check if we need superuser privileges
    const isSuperuserResult = await client.query(`
      SELECT rolsuper FROM pg_roles WHERE rolname = $1
    `, [currentUser]);

    const isSuperuser = isSuperuserResult.rows[0]?.rolsuper || false;

    if (!isSuperuser) {
      console.log('\n⚠️  You are not a superuser.');
      console.log('   Attempting to change ownership anyway...');
      console.log('   (This will only work if you own the tables)\n');
    }

    // Tables to change ownership
    const tables = ['users', 'user_sessions', 'user_usage', 'usage_logs'];
    const sequences = ['users_id_seq', 'user_sessions_id_seq', 'user_usage_id_seq', 'usage_logs_id_seq'];

    // Quote the username to preserve case
    const quotedUser = `"${currentUser}"`;

    console.log('📊 Changing table ownership:\n');

    // Change table ownership
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} OWNER TO ${quotedUser}`);
        console.log(`   ✅ ${table.padEnd(20)} → ${currentUser}`);
      } catch (err) {
        console.log(`   ❌ ${table.padEnd(20)} → Failed: ${err.message}`);
      }
    }

    console.log('\n🔢 Changing sequence ownership:\n');

    // Change sequence ownership
    for (const seq of sequences) {
      try {
        await client.query(`ALTER SEQUENCE ${seq} OWNER TO ${quotedUser}`);
        console.log(`   ✅ ${seq.padEnd(30)} → ${currentUser}`);
      } catch (err) {
        console.log(`   ⚠️  ${seq.padEnd(30)} → Failed: ${err.message}`);
      }
    }

    // Verify ownership
    console.log('\n📋 Verifying new ownership:\n');

    const verifyResult = await client.query(`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
      ORDER BY tablename
    `);

    let allOwnedByCurrentUser = true;
    for (const row of verifyResult.rows) {
      const isOwner = row.tableowner === currentUser;
      console.log(`   ${row.tablename.padEnd(20)} owner: ${row.tableowner} ${isOwner ? '✅' : '❌'}`);
      if (!isOwner) allOwnedByCurrentUser = false;
    }

    if (allOwnedByCurrentUser) {
      console.log('\n✅ SUCCESS! You now own all tables.');
      console.log('   You have full permissions and can run your application.\n');
    } else {
      console.log('\n⚠️  Some tables are still owned by other users.');
      console.log('\n💡 You need to run this script as a PostgreSQL superuser or contact your hosting provider.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 This operation requires either:');
    console.error('1. Being the current owner of the tables');
    console.error('2. Being a PostgreSQL superuser');
    console.error('3. Contact your hosting provider (o2switch support)\n');
    console.error('Alternative: Use a different DB_USER that owns the tables\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

changeOwnership();
