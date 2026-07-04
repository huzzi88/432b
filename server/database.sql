-- ╔══════════════════════════════════════════════════════════════╗
-- ║        🪐 KEPLER432B — Complete Database Setup             ║
-- ║        17 Tables + Indexes + Seed Data                     ║
-- ║                                                            ║
-- ║   psql -U postgres -d kepler432b -f database.sql           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- CREATE DATABASE kepler432b;  -- uncomment on first run
-- \c kepler432b;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════════════════
-- 1. USERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    password                VARCHAR(255),
    login_pin               VARCHAR(255),
    phone                   VARCHAR(50),
    address                 TEXT,
    city                    VARCHAR(100),
    country                 VARCHAR(100),
    date_of_birth           DATE,
    gender                  VARCHAR(20),
    occupation              VARCHAR(100),
    profile_image           TEXT,
    balance                 DECIMAL(18,2) DEFAULT 0,
    total_invested          DECIMAL(18,2) DEFAULT 0,
    total_earnings          DECIMAL(18,2) DEFAULT 0,
    total_withdrawn         DECIMAL(18,2) DEFAULT 0,
    referral_code           VARCHAR(20) UNIQUE NOT NULL,
    referred_by             VARCHAR(20),
    referral_count          INT DEFAULT 0,
    referral_bonus_percentage DECIMAL(5,2) DEFAULT 0,
    referral_earnings       DECIMAL(18,2) DEFAULT 0,
    referral_level2_count   INT DEFAULT 0,
    joined_date             TIMESTAMPTZ DEFAULT NOW(),
    is_blocked              BOOLEAN DEFAULT FALSE,
    kyc_status              VARCHAR(20) DEFAULT 'none',
    cnic_number             VARCHAR(50),
    two_factor_enabled      BOOLEAN DEFAULT FALSE,
    is_admin                BOOLEAN DEFAULT FALSE,
    admin_pin1              VARCHAR(255),
    admin_pin2              VARCHAR(255),
    admin_pin3              VARCHAR(255),
    wallet_address          VARCHAR(255),
    wallet_signature        TEXT,
    wallet_nonce            VARCHAR(255),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
-- Unique index on wallet_address
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- 2. INVESTMENT PLANS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS investment_plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    min_amount        DECIMAL(18,2) DEFAULT 0,
    max_amount        DECIMAL(18,2) DEFAULT 0,
    roi_percentage    DECIMAL(8,2) NOT NULL DEFAULT 0,
    duration_days     INT NOT NULL DEFAULT 30,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 3. SLOTS (inside plans)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS slots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id           UUID NOT NULL REFERENCES investment_plans(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    roi_percentage    DECIMAL(8,2) NOT NULL DEFAULT 0,
    duration_days     INT NOT NULL DEFAULT 30,
    min_amount        DECIMAL(18,2) DEFAULT 0,
    max_amount        DECIMAL(18,2) DEFAULT 0,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 4. LOTS (inside slots)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id           UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    roi_percentage    DECIMAL(8,2) NOT NULL DEFAULT 0,
    duration_days     INT NOT NULL DEFAULT 30,
    lot_size          DECIMAL(18,2) NOT NULL DEFAULT 0,
    max_persons       INT NOT NULL DEFAULT 10,
    current_persons   INT DEFAULT 0,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 5. INVESTMENTS (supports plan/slot/lot level)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS investments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id           UUID REFERENCES investment_plans(id) ON DELETE SET NULL,
    slot_id           UUID REFERENCES slots(id) ON DELETE SET NULL,
    lot_id            UUID REFERENCES lots(id) ON DELETE SET NULL,
    invest_level      VARCHAR(10) DEFAULT 'plan',
    amount            DECIMAL(18,2) NOT NULL,
    start_date        TIMESTAMPTZ DEFAULT NOW(),
    end_date          TIMESTAMPTZ NOT NULL,
    daily_profit      DECIMAL(18,4) DEFAULT 0,
    total_profit      DECIMAL(18,2) DEFAULT 0,
    earned_profit     DECIMAL(18,2) DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'pending',
    cancel_requested  BOOLEAN DEFAULT FALSE,
    admin_notes       TEXT,
    last_profit_date  DATE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 6. TRANSACTIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS transactions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type              VARCHAR(20) NOT NULL,
    amount            DECIMAL(18,2) NOT NULL,
    status            VARCHAR(20) DEFAULT 'pending',
    payment_method    VARCHAR(100),
    payment_details   TEXT,
    proof_image       TEXT,
    notes             TEXT,
    chain             VARCHAR(50),
    tx_hash           VARCHAR(255),
    wallet_from       VARCHAR(255),
    date              TIMESTAMPTZ DEFAULT NOW(),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 7. PAYMENT GATEWAYS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payment_gateways (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    type              VARCHAR(50) NOT NULL,
    account_details   TEXT NOT NULL,
    wallet_address    VARCHAR(255),
    chain             VARCHAR(50),
    is_active         BOOLEAN DEFAULT TRUE,
    icon              VARCHAR(50) DEFAULT '💳',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 8. KYC DOCUMENTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS kyc_documents (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cnic_number       VARCHAR(50) NOT NULL,
    cnic_front_image  TEXT,
    cnic_back_image   TEXT,
    selfie_image      TEXT,
    status            VARCHAR(20) DEFAULT 'pending',
    rejection_reason  TEXT,
    reviewed_by       UUID REFERENCES users(id),
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 9. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title             VARCHAR(255) NOT NULL,
    message           TEXT NOT NULL,
    is_active         BOOLEAN DEFAULT TRUE,
    date              TIMESTAMPTZ DEFAULT NOW(),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 10. TASKS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tasks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    reward_amount     DECIMAL(18,2) NOT NULL,
    screenshot_url    TEXT,
    status            VARCHAR(20) DEFAULT 'pending',
    rejection_reason  TEXT,
    submitted_at      TIMESTAMPTZ,
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 11. REFERRAL EARNINGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_earnings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_id         UUID REFERENCES investments(id) ON DELETE SET NULL,
    tier                  INT NOT NULL DEFAULT 1,
    commission_percentage DECIMAL(5,2) NOT NULL,
    amount                DECIMAL(18,2) NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 12. ACTIVITY LOGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    action            VARCHAR(100) NOT NULL,
    description       TEXT,
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    metadata          JSONB,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 13. PROFIT DISTRIBUTION LOGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profit_distribution_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id     UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount            DECIMAL(18,4) NOT NULL,
    investment_status VARCHAR(20),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 14. COMPETITIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS competitions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    type                  VARCHAR(50) NOT NULL DEFAULT 'referral',
    target_referrals      INT DEFAULT 0,
    target_deposit_amount DECIMAL(18,2) DEFAULT 0,
    target_invest_amount  DECIMAL(18,2) DEFAULT 0,
    prize_description     TEXT,
    prize_amount          DECIMAL(18,2) DEFAULT 0,
    start_date            TIMESTAMPTZ DEFAULT NOW(),
    end_date              TIMESTAMPTZ,
    is_active             BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 15. COMPETITION ENTRIES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS competition_entries (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id    UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_referrals INT DEFAULT 0,
    current_deposit   DECIMAL(18,2) DEFAULT 0,
    current_invest    DECIMAL(18,2) DEFAULT 0,
    is_completed      BOOLEAN DEFAULT FALSE,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- 16. BLOG CATEGORIES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS blog_categories (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 17. BLOG POSTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS blog_posts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id       UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    content           TEXT NOT NULL,
    image             TEXT,
    is_published      BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 18. DAILY ROI RATES — Admin sets daily ROI %
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_roi_rates (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_date         DATE NOT NULL UNIQUE,
    roi_percentage    DECIMAL(8,4) NOT NULL DEFAULT 0,
    note              TEXT,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral         ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by      ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_is_admin         ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_investments_user       ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status     ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_plan       ON investments(plan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user      ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned         ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status           ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_kyc_user               ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status             ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_referral_referrer      ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_referred      ON referral_earnings(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user          ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action        ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created       ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profit_log_inv         ON profit_distribution_logs(investment_id);
CREATE INDEX IF NOT EXISTS idx_profit_log_user        ON profit_distribution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_slots_plan             ON slots(plan_id);
CREATE INDEX IF NOT EXISTS idx_lots_slot              ON lots(slot_id);
CREATE INDEX IF NOT EXISTS idx_competitions_active    ON competitions(is_active);
CREATE INDEX IF NOT EXISTS idx_comp_entries_comp      ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_entries_user      ON competition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_cat         ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published   ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_roi_rates_date         ON daily_roi_rates(rate_date);


-- ═══════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════

-- Default Plans
INSERT INTO investment_plans (name, description, min_amount, max_amount, roi_percentage, duration_days)
SELECT * FROM (VALUES
    ('Starter Plan',  '3% return in 30 days',  10.00,    500.00,   3.00, 30),
    ('Growth Plan',   '5% return in 30 days',  100.00,   5000.00,  5.00, 30),
    ('Premium Plan',  '8% return in 60 days',  500.00,   50000.00, 8.00, 60)
) AS v(name, description, min_amount, max_amount, roi_percentage, duration_days)
WHERE NOT EXISTS (SELECT 1 FROM investment_plans LIMIT 1);

-- Default Gateways
INSERT INTO payment_gateways (name, type, account_details, icon)
SELECT * FROM (VALUES
    ('JazzCash',       'jazzcash',  '03XX-XXXXXXX',    '📱'),
    ('EasyPaisa',      'easypaisa', '03XX-XXXXXXX',    '💳'),
    ('Bank Transfer',  'bank',      'IBAN: XXXX-XXXX', '🏦'),
    ('USDT (TRC20)',   'crypto',    'TXxxxxxxxxx',     '₮')
) AS v(name, type, account_details, icon)
WHERE NOT EXISTS (SELECT 1 FROM payment_gateways LIMIT 1);

-- Welcome Notification
INSERT INTO notifications (title, message)
SELECT 'Welcome to Kepler432B', 'Start investing today!'
WHERE NOT EXISTS (SELECT 1 FROM notifications LIMIT 1);

-- Default Blog Category
INSERT INTO blog_categories (name)
SELECT 'General'
WHERE NOT EXISTS (SELECT 1 FROM blog_categories LIMIT 1);


-- ═══════════════════════════════════════════════════════
-- VERIFY — show all tables and row counts
-- ═══════════════════════════════════════════════════════
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'users' as "table", COUNT(*) as "rows" FROM users
UNION ALL SELECT 'investment_plans', COUNT(*) FROM investment_plans
UNION ALL SELECT 'slots', COUNT(*) FROM slots
UNION ALL SELECT 'lots', COUNT(*) FROM lots
UNION ALL SELECT 'investments', COUNT(*) FROM investments
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'payment_gateways', COUNT(*) FROM payment_gateways
UNION ALL SELECT 'kyc_documents', COUNT(*) FROM kyc_documents
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'referral_earnings', COUNT(*) FROM referral_earnings
UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL SELECT 'profit_distribution_logs', COUNT(*) FROM profit_distribution_logs
UNION ALL SELECT 'competitions', COUNT(*) FROM competitions
UNION ALL SELECT 'competition_entries', COUNT(*) FROM competition_entries
UNION ALL SELECT 'blog_categories', COUNT(*) FROM blog_categories
UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
ORDER BY "table";


-- ═══════════════════════════════════════════════════════
-- ⚠️  ADMIN USER: Use `npm run seed` to create admin
--     with proper bcrypt hashes from your .env file.
--     This SQL file does NOT create admin because bcrypt
--     hashes are salt-unique and can't be hardcoded.
--
--     cd server && npm install && npm run seed
-- ═══════════════════════════════════════════════════════
