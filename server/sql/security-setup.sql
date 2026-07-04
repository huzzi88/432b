-- ═══════════════════════════════════════════════════════════════
-- KEPLER432B — PostgreSQL Security Hardening
-- Run as postgres superuser ONCE during initial setup
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. CREATE RESTRICTED APPLICATION USER
--    Principle of Least Privilege: NO superuser, NO createdb
-- ───────────────────────────────────────────────────────────────

-- Create the application user (change password in production!)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kepler432b_app') THEN
    CREATE ROLE kepler432b_app WITH
      LOGIN                     -- can connect
      PASSWORD 'CHANGE_THIS_STRONG_PASSWORD_IN_PRODUCTION'
      NOSUPERUSER               -- NOT a superuser
      NOCREATEDB                -- cannot create databases
      NOCREATEROLE              -- cannot create other roles
      NOINHERIT                 -- must explicitly SET ROLE
      CONNECTION LIMIT 25;      -- max 25 simultaneous connections
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 2. GRANT MINIMUM REQUIRED PERMISSIONS
--    Only SELECT, INSERT, UPDATE, DELETE on app tables
--    No DROP, TRUNCATE, ALTER, or schema changes
-- ───────────────────────────────────────────────────────────────

-- Connect to the database first:
-- \c kepler432b

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO kepler432b_app;

-- Grant ONLY CRUD operations on all current tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kepler432b_app;

-- Grant usage on sequences (needed for DEFAULT uuid_generate_v4())
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO kepler432b_app;

-- Auto-grant permissions on future tables created by postgres
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kepler432b_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO kepler432b_app;

-- ───────────────────────────────────────────────────────────────
-- 3. REVOKE DANGEROUS PERMISSIONS
-- ───────────────────────────────────────────────────────────────

-- Revoke ability to create objects in public schema
REVOKE CREATE ON SCHEMA public FROM kepler432b_app;

-- Revoke TRUNCATE (prevents mass data deletion)
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM kepler432b_app;

-- Revoke access to pg system catalogs (info leak prevention)
REVOKE ALL ON pg_catalog.pg_proc FROM kepler432b_app;
REVOKE ALL ON pg_catalog.pg_namespace FROM kepler432b_app;

-- ───────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (Optional, advanced)
--    Uncomment to enable per-user data isolation
-- ───────────────────────────────────────────────────────────────

-- ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_investments ON investments
--   FOR ALL TO kepler432b_app
--   USING (user_id = current_setting('app.current_user_id')::uuid);

-- ───────────────────────────────────────────────────────────────
-- 5. PASSWORD POLICY
-- ───────────────────────────────────────────────────────────────

-- Force password expiry (90 days)
DO $$
BEGIN
  EXECUTE format(
    'ALTER ROLE kepler432b_app VALID UNTIL %L',
    (CURRENT_DATE + INTERVAL '90 days')::text
  );
END $$;

-- ───────────────────────────────────────────────────────────────
-- 6. VERIFY SETUP
-- ───────────────────────────────────────────────────────────────
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolconnlimit
FROM pg_roles WHERE rolname = 'kepler432b_app';


-- ═══════════════════════════════════════════════════════════════
-- pg_hba.conf SETTINGS (add to /etc/postgresql/XX/main/pg_hba.conf)
-- ═══════════════════════════════════════════════════════════════
--
-- Replace the default lines with these STRICT rules:
--
-- # TYPE  DATABASE        USER              ADDRESS          METHOD
--
-- # Superuser (postgres) — local socket only, no network
-- local   all             postgres                           peer
--
-- # Application user — only from backend server IP, SSL required
-- hostssl kepler432b      kepler432b_app    127.0.0.1/32     scram-sha-256
-- hostssl kepler432b      kepler432b_app    ::1/128          scram-sha-256
--
-- # For production with separate backend server:
-- # hostssl kepler432b    kepler432b_app    10.0.1.5/32      scram-sha-256
--
-- # Reject everything else
-- host    all             all               0.0.0.0/0        reject
-- host    all             all               ::0/0            reject
--
-- After editing pg_hba.conf, reload:
-- sudo systemctl reload postgresql
--
-- ═══════════════════════════════════════════════════════════════
-- postgresql.conf HARDENING (add/modify these lines)
-- ═══════════════════════════════════════════════════════════════
--
-- # SSL — required for production
-- ssl = on
-- ssl_cert_file = '/etc/ssl/certs/server.crt'
-- ssl_key_file = '/etc/ssl/private/server.key'
-- ssl_min_protocol_version = 'TLSv1.2'
--
-- # Logging — audit trail
-- log_connections = on
-- log_disconnections = on
-- log_statement = 'mod'              -- log INSERT/UPDATE/DELETE
-- log_min_duration_statement = 1000  -- log queries > 1 second
--
-- # Connection limits
-- max_connections = 100
-- superuser_reserved_connections = 3
--
-- # Statement timeout (global fallback)
-- statement_timeout = '60s'
--
-- # Password encryption
-- password_encryption = 'scram-sha-256'
--
-- ═══════════════════════════════════════════════════════════════
