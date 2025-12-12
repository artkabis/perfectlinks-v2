-- ============================================================================
-- Perfect Links API - Database Schema
-- PostgreSQL 9.6+ Compatible (No extensions required)
-- ============================================================================
--
-- This schema is designed to work with PostgreSQL 9.6+ without requiring
-- any extensions. UUID values are generated in the application layer.
--
-- Tables:
--   - users: User accounts with authentication
--   - user_sessions: Active user sessions with tokens
--   - user_usage: Usage tracking and quota management
--   - usage_logs: API request logging
--
-- ============================================================================

-- Drop existing tables if they exist (use with caution in production)
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_usage CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_plan_type CASCADE;
DROP TYPE IF EXISTS user_status_type CASCADE;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- User plan enumeration
CREATE TYPE user_plan_type AS ENUM ('free', 'premium', 'pro');

-- User status enumeration
CREATE TYPE user_status_type AS ENUM ('pending', 'active', 'suspended', 'deleted');

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Stores user account information
-- IMPORTANT: The application must provide 'user_id' during INSERT
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan user_plan_type NOT NULL DEFAULT 'free',
    status user_status_type NOT NULL DEFAULT 'pending',
    email_validated BOOLEAN NOT NULL DEFAULT FALSE,
    validation_token VARCHAR(255),
    validation_token_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT email_lowercase CHECK (email = LOWER(email)),
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_validation_token ON users(validation_token);

-- ============================================================================
-- TABLE: user_sessions
-- ============================================================================
-- Stores active user sessions with JWT tokens
-- IMPORTANT: The application must provide 'session_id' during INSERT
-- ============================================================================

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for session management
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_access_token ON user_sessions(access_token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);

-- ============================================================================
-- TABLE: user_usage
-- Description: Tracks quota usage and limits per user
-- ============================================================================
CREATE TABLE user_usage (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    requests_made INTEGER NOT NULL DEFAULT 0,
    requests_limit INTEGER NOT NULL DEFAULT 100,
    period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    last_request_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT requests_made_positive CHECK (requests_made >= 0),
    CONSTRAINT requests_limit_positive CHECK (requests_limit > 0)
);

-- Indexes for quota checking
CREATE INDEX idx_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_usage_period_end ON user_usage(period_end);

-- ============================================================================
-- TABLE: usage_logs
-- Description: Detailed logs of each API request for analytics
-- ============================================================================
CREATE TABLE usage_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    site_url TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics and logs
CREATE INDEX idx_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_logs_endpoint ON usage_logs(endpoint);
CREATE INDEX idx_logs_status_code ON usage_logs(status_code);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for user_usage table
CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to initialize user usage when a new user is created
CREATE OR REPLACE FUNCTION initialize_user_usage()
RETURNS TRIGGER AS $$
DECLARE
    initial_limit INTEGER;
BEGIN
    -- Determine initial limit based on plan
    CASE NEW.plan
        WHEN 'free' THEN initial_limit := 100;
        WHEN 'premium' THEN initial_limit := 500;
        WHEN 'pro' THEN initial_limit := 1000;
        ELSE initial_limit := 100;
    END CASE;

    -- Create usage record
    INSERT INTO user_usage (user_id, requests_limit, period_start, period_end)
    VALUES (
        NEW.user_id,
        initial_limit,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '30 days'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create usage record when user is created
CREATE TRIGGER create_user_usage
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE PROCEDURE initialize_user_usage();

-- Function to update usage limit when plan changes
CREATE OR REPLACE FUNCTION update_usage_limit_on_plan_change()
RETURNS TRIGGER AS $$
DECLARE
    new_limit INTEGER;
BEGIN
    IF NEW.plan != OLD.plan THEN
        -- Determine new limit based on plan
        CASE NEW.plan
            WHEN 'free' THEN new_limit := 100;
            WHEN 'premium' THEN new_limit := 500;
            WHEN 'pro' THEN new_limit := 1000;
            ELSE new_limit := 100;
        END CASE;

        -- Update usage limit
        UPDATE user_usage
        SET requests_limit = new_limit
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update limit when plan changes
CREATE TRIGGER update_limit_on_plan_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_usage_limit_on_plan_change();

-- Function to clean up expired sessions (call this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset quota for users whose period has ended
CREATE OR REPLACE FUNCTION reset_expired_quotas()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_usage
    SET
        requests_made = 0,
        period_start = CURRENT_TIMESTAMP,
        period_end = CURRENT_TIMESTAMP + INTERVAL '30 days'
    WHERE period_end < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (Optional - for testing)
-- ============================================================================

-- Create a test user (password: TestPassword123!)
-- Password hash for "TestPassword123!" with bcrypt rounds=12
-- INSERT INTO users (username, email, password_hash, plan, status, email_validated)
-- VALUES (
--     'testuser',
--     'test@perfectlinks.fr',
--     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLHJ5jSu',
--     'premium',
--     'active',
--     TRUE
-- );

-- ============================================================================
-- GRANTS (Adjust according to your user permissions)
-- ============================================================================

-- Grant all privileges to the application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO perfectlinks_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO perfectlinks_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO perfectlinks_user;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user account information and authentication details';
COMMENT ON TABLE user_sessions IS 'Tracks active JWT sessions and refresh tokens';
COMMENT ON TABLE user_usage IS 'Manages quota limits and usage tracking per user';
COMMENT ON TABLE usage_logs IS 'Detailed logs of API requests for analytics and debugging';

COMMENT ON COLUMN users.user_id IS 'Unique UUID identifier for the user';
COMMENT ON COLUMN users.validation_token IS 'Token sent via email for account validation';
COMMENT ON COLUMN users.validation_token_expires IS 'Expiration timestamp for validation token';
COMMENT ON COLUMN user_usage.period_start IS 'Start of the current 30-day quota period';
COMMENT ON COLUMN user_usage.period_end IS 'End of the current 30-day quota period';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
