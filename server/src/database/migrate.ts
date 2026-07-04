// Standalone migration — EXACT match with server.ts inline migration
// Usage: cd server && npx ts-node src/database/migrate.ts
import pool from './db';

const migrate = async () => {
  console.log('🔄 Running migrations...');
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        login_pin VARCHAR(255),
        phone VARCHAR(50), address TEXT, city VARCHAR(100), country VARCHAR(100),
        date_of_birth DATE, gender VARCHAR(20), occupation VARCHAR(100), profile_image TEXT,
        balance DECIMAL(18,2) DEFAULT 0,
        total_invested DECIMAL(18,2) DEFAULT 0, total_earnings DECIMAL(18,2) DEFAULT 0, total_withdrawn DECIMAL(18,2) DEFAULT 0,
        referral_code VARCHAR(20) UNIQUE NOT NULL, referred_by VARCHAR(20),
        referral_count INT DEFAULT 0, referral_bonus_percentage DECIMAL(5,2) DEFAULT 0,
        referral_earnings DECIMAL(18,2) DEFAULT 0, referral_level2_count INT DEFAULT 0,
        joined_date TIMESTAMPTZ DEFAULT NOW(), is_blocked BOOLEAN DEFAULT FALSE,
        kyc_status VARCHAR(20) DEFAULT 'none',
        cnic_number VARCHAR(50), two_factor_enabled BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE, admin_pin1 VARCHAR(255), admin_pin2 VARCHAR(255), admin_pin3 VARCHAR(255),
        wallet_address VARCHAR(255), wallet_signature TEXT, wallet_nonce VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;

      CREATE TABLE IF NOT EXISTS investment_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL, description TEXT,
        min_amount DECIMAL(18,2) DEFAULT 0, max_amount DECIMAL(18,2) DEFAULT 0,
        roi_percentage DECIMAL(8,2) NOT NULL DEFAULT 0, duration_days INT NOT NULL DEFAULT 30,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS slots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID NOT NULL REFERENCES investment_plans(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL, description TEXT,
        roi_percentage DECIMAL(8,2) NOT NULL DEFAULT 0, duration_days INT NOT NULL DEFAULT 30,
        min_amount DECIMAL(18,2) DEFAULT 0, max_amount DECIMAL(18,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL, description TEXT,
        roi_percentage DECIMAL(8,2) NOT NULL DEFAULT 0, duration_days INT NOT NULL DEFAULT 30,
        lot_size DECIMAL(18,2) NOT NULL DEFAULT 0,
        max_persons INT NOT NULL DEFAULT 10, current_persons INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS investments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES investment_plans(id) ON DELETE SET NULL,
        slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
        lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
        invest_level VARCHAR(10) DEFAULT 'plan',
        amount DECIMAL(18,2) NOT NULL,
        start_date TIMESTAMPTZ DEFAULT NOW(), end_date TIMESTAMPTZ NOT NULL,
        daily_profit DECIMAL(18,4) DEFAULT 0, total_profit DECIMAL(18,2) DEFAULT 0,
        earned_profit DECIMAL(18,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        cancel_requested BOOLEAN DEFAULT FALSE, admin_notes TEXT,
        last_profit_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL, amount DECIMAL(18,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(100), payment_details TEXT, proof_image TEXT, notes TEXT,
        chain VARCHAR(50), tx_hash VARCHAR(255), wallet_from VARCHAR(255),
        date TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_gateways (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, account_details TEXT NOT NULL,
        wallet_address VARCHAR(255), chain VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE, icon VARCHAR(50) DEFAULT '💳', created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS kyc_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cnic_number VARCHAR(50) NOT NULL, cnic_front_image TEXT, cnic_back_image TEXT, selfie_image TEXT,
        status VARCHAR(20) DEFAULT 'pending', rejection_reason TEXT,
        reviewed_by UUID REFERENCES users(id), reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL, message TEXT NOT NULL, is_active BOOLEAN DEFAULT TRUE,
        date TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
        reward_amount DECIMAL(18,2) NOT NULL, screenshot_url TEXT,
        status VARCHAR(20) DEFAULT 'pending', rejection_reason TEXT,
        submitted_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS referral_earnings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
        tier INT NOT NULL DEFAULT 1, commission_percentage DECIMAL(5,2) NOT NULL,
        amount DECIMAL(18,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL, description TEXT, ip_address VARCHAR(45), user_agent TEXT,
        metadata JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profit_distribution_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(18,4) NOT NULL, investment_status VARCHAR(20), created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS competitions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL, description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'referral', target_referrals INT DEFAULT 0,
        target_deposit_amount DECIMAL(18,2) DEFAULT 0, target_invest_amount DECIMAL(18,2) DEFAULT 0,
        prize_description TEXT, prize_amount DECIMAL(18,2) DEFAULT 0,
        start_date TIMESTAMPTZ DEFAULT NOW(), end_date TIMESTAMPTZ, is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS competition_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_referrals INT DEFAULT 0, current_deposit DECIMAL(18,2) DEFAULT 0,
        current_invest DECIMAL(18,2) DEFAULT 0, is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(competition_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS blog_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL, content TEXT NOT NULL, image TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- DAILY ROI RATES TABLE — Admin sets daily ROI that applies to ALL active investments
      CREATE TABLE IF NOT EXISTS daily_roi_rates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rate_date DATE NOT NULL UNIQUE,
        roi_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
        note TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
      CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_slots_plan ON slots(plan_id);
      CREATE INDEX IF NOT EXISTS idx_lots_slot ON lots(slot_id);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_cat ON blog_posts(category_id);
      CREATE INDEX IF NOT EXISTS idx_comp_entries_comp ON competition_entries(competition_id);
      CREATE INDEX IF NOT EXISTS idx_roi_rates_date ON daily_roi_rates(rate_date);
    `);
    console.log('✅ All 18 tables ready!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
