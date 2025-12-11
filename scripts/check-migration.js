require('dotenv').config();
const { pool, closePool } = require('../config/database');

/**
 * Check database migration status
 */
async function checkMigration() {
  try {
    console.log('🔍 Checking database migration status...\n');

    // Check if database tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'user_sessions', 'user_usage', 'usage_logs')
      ORDER BY table_name
    `);

    console.log('📊 Database Tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found');
      console.log('\n   Run: npm run db:setup');
      await closePool();
      process.exit(0);
    }

    tablesResult.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check users count
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users: ${usersCount.rows[0].count}`);

    // Check sessions count
    const sessionsCount = await pool.query('SELECT COUNT(*) as count FROM user_sessions WHERE is_active = TRUE');
    console.log(`🔐 Active Sessions: ${sessionsCount.rows[0].count}`);

    // Check usage logs count
    const logsCount = await pool.query('SELECT COUNT(*) as count FROM usage_logs');
    console.log(`📝 Usage Logs: ${logsCount.rows[0].count}`);

    // Get users with their stats
    if (parseInt(usersCount.rows[0].count, 10) > 0) {
      const usersWithStats = await pool.query(`
        SELECT
          u.username,
          u.email,
          u.plan,
          u.status,
          u.email_validated,
          uu.requests_made,
          uu.requests_limit,
          COUNT(ul.id) as total_requests
        FROM users u
        LEFT JOIN user_usage uu ON u.user_id = uu.user_id
        LEFT JOIN usage_logs ul ON u.user_id = ul.user_id
        GROUP BY u.user_id, u.username, u.email, u.plan, u.status, u.email_validated,
                 uu.requests_made, uu.requests_limit
        ORDER BY u.created_at DESC
        LIMIT 10
      `);

      console.log('\n📋 Recent Users:');
      console.log('─'.repeat(80));
      console.log(
        '  Username'.padEnd(20),
        'Email'.padEnd(30),
        'Plan'.padEnd(10),
        'Status'.padEnd(12),
        'Usage'
      );
      console.log('─'.repeat(80));

      usersWithStats.rows.forEach((user) => {
        const validated = user.email_validated ? '✓' : '✗';
        const usage = `${user.requests_made || 0}/${user.requests_limit || 0}`;
        console.log(
          `${validated} ${user.username.padEnd(18)}`,
          user.email.padEnd(30),
          user.plan.padEnd(10),
          user.status.padEnd(12),
          usage
        );
      });
    }

    // Check for expired quotas
    const expiredQuotas = await pool.query(`
      SELECT COUNT(*) as count
      FROM user_usage
      WHERE period_end < NOW()
    `);

    if (parseInt(expiredQuotas.rows[0].count, 10) > 0) {
      console.log(`\n⚠️  ${expiredQuotas.rows[0].count} expired quotas need reset`);
      console.log('   Run quota reset with: SELECT reset_expired_quotas();');
    }

    // Check for expired sessions
    const expiredSessions = await pool.query(`
      SELECT COUNT(*) as count
      FROM user_sessions
      WHERE expires_at < NOW() AND is_active = TRUE
    `);

    if (parseInt(expiredSessions.rows[0].count, 10) > 0) {
      console.log(`\n🗑️  ${expiredSessions.rows[0].count} expired sessions need cleanup`);
      console.log('   Run cleanup with: SELECT cleanup_expired_sessions();');
    }

    console.log('\n✅ Database check completed');
  } catch (error) {
    console.error('\n❌ Database check failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check if PostgreSQL is running');
      console.error('   2. Verify database credentials in .env file');
      console.error('   3. Ensure database exists');
    } else if (error.code === '42P01') {
      console.error('\n💡 Tables not found. Run: npm run db:setup');
    }

    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run check
checkMigration();
