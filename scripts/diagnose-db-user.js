#!/usr/bin/env node
/**
 * PostgreSQL User Diagnostic Tool
 *
 * This script checks:
 * 1. What PostgreSQL roles/users exist
 * 2. Who owns the database tables
 * 3. Current database connection info
 */

const { Client } = require('pg');
require('dotenv').config();

async function diagnose() {
  console.log('\n🔍 PostgreSQL User Diagnostic\n');
  console.log('━'.repeat(60));

  // Display .env configuration
  console.log('\n📋 Configuration from .env:');
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 5432}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   DB_USER: ${process.env.DB_USER}`);
  console.log(`   Password: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}`);

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('\n✅ Connected to database successfully');
    console.log('━'.repeat(60));

    // 1. Check current user
    console.log('\n👤 Current connected user:');
    const currentUserResult = await client.query('SELECT current_user, session_user');
    console.log(`   current_user: ${currentUserResult.rows[0].current_user}`);
    console.log(`   session_user: ${currentUserResult.rows[0].session_user}`);

    // 2. List all roles/users in the database
    console.log('\n👥 Available PostgreSQL roles/users:');
    const rolesResult = await client.query(`
      SELECT rolname, rolsuper, rolcreatedb, rolcreaterole
      FROM pg_roles
      WHERE rolname NOT LIKE 'pg_%'
      ORDER BY rolname
    `);

    if (rolesResult.rows.length === 0) {
      console.log('   No roles found');
    } else {
      rolesResult.rows.forEach(role => {
        const flags = [];
        if (role.rolsuper) flags.push('SUPERUSER');
        if (role.rolcreatedb) flags.push('CREATEDB');
        if (role.rolcreaterole) flags.push('CREATEROLE');
        console.log(`   - ${role.rolname} ${flags.length ? `(${flags.join(', ')})` : ''}`);
      });
    }

    // 3. Check if tables exist and who owns them
    console.log('\n📊 Database tables ownership:');
    const tablesResult = await client.query(`
      SELECT tablename, tableowner
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found - run npm run db:setup first');
    } else {
      tablesResult.rows.forEach(table => {
        const isOwner = table.tableowner === currentUserResult.rows[0].current_user;
        console.log(`   - ${table.tablename.padEnd(20)} owner: ${table.tableowner} ${isOwner ? '✅' : '❌'}`);
      });
    }

    // 4. Check current user's privileges on tables
    if (tablesResult.rows.length > 0) {
      console.log('\n🔐 Current user privileges:');
      const privilegesResult = await client.query(`
        SELECT
          table_name,
          string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
        FROM information_schema.table_privileges
        WHERE table_schema = 'public'
          AND grantee = $1
        GROUP BY table_name
        ORDER BY table_name
      `, [currentUserResult.rows[0].current_user]);

      if (privilegesResult.rows.length === 0) {
        console.log('   ⚠️  No explicit privileges found');
        console.log('   (You may still have privileges as table owner)');
      } else {
        privilegesResult.rows.forEach(priv => {
          console.log(`   - ${priv.table_name.padEnd(20)} ${priv.privileges}`);
        });
      }
    }

    console.log('\n━'.repeat(60));
    console.log('\n💡 Recommendations:');

    const currentUser = currentUserResult.rows[0].current_user;
    const dbUser = process.env.DB_USER;

    // Only show warning if the names don't match
    if (currentUser !== dbUser) {
      console.log(`\n⚠️  WARNING: User name mismatch detected!`);
      console.log(`   .env DB_USER: ${dbUser}`);
      console.log(`   Actual user:  ${currentUser}`);
      console.log(`\n   Update your .env file to use: DB_USER=${currentUser}`);
    }

    if (tablesResult.rows.length > 0) {
      const notOwned = tablesResult.rows.filter(
        t => t.tableowner !== currentUser
      );

      if (notOwned.length > 0) {
        console.log(`\n⚠️  You don't own these tables:`);
        notOwned.forEach(t => console.log(`   - ${t.tablename} (owner: ${t.tableowner})`));
        console.log(`\n   You need to either:`);
        console.log(`   1. Connect as the owner: ${notOwned[0].tableowner}`);
        console.log(`   2. Or have a superuser grant you permissions`);
      } else {
        console.log(`\n✅ You own all tables - you have full privileges!`);
        console.log(`   No need to run grants, you already have all permissions.`);
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

diagnose();
