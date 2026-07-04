// ═══════════════════════════════════════════════════════
// KEPLER432B — Production-Hardened Server
// ═══════════════════════════════════════════════════════
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

import pool from './database/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import investmentRoutes from './routes/investments';
import transactionRoutes from './routes/transactions';
import gatewayRoutes from './routes/gateways';
import notificationRoutes from './routes/notifications';
import taskRoutes from './routes/tasks';
import competitionRoutes from './routes/competitions';
import csvRoutes from './routes/csv';
import slotsLotsRoutes from './routes/slotsLots';
import blogRoutes from './routes/blogs';
import walletRoutes from './routes/wallet';
import roiRatesRoutes from './routes/roiRates';
import settingsRoutes from './routes/settings';
import cryptoDepositRoutes from './routes/cryptoDeposit';
import { verifyPendingDeposits } from './jobs/verifyPendingDeposits';
import { activatePools } from './jobs/activatePool';
import { distributeProfits } from './jobs/profitDistribution';
import { sanitizeBody, globalErrorHandler, extraSecurityHeaders, strictBodyLimit, sqlInjectionProtection, pathTraversalProtection, honeypotDetection } from './middleware/security';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const IS_PROD = process.env.NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════
// FIX #1: Trust proxy — REQUIRED when behind reverse proxy
// (Dokploy/Traefik/Nginx/Cloudflare)
// Without this, express-rate-limit crashes on X-Forwarded-For
// ═══════════════════════════════════════════════════════
app.set('trust proxy', 1);

// Helmet — CSP connectSrc needs each origin as separate array entry
const cspConnectSrc: string[] = ["'self'"];
(process.env.CORS_ORIGIN || '').split(',').forEach(o => {
  const trimmed = o.trim();
  if (trimmed && trimmed !== '*') cspConnectSrc.push(trimmed);
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: cspConnectSrc,
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// CORS
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(extraSecurityHeaders);
app.use(sanitizeBody);
app.use(sqlInjectionProtection);
app.use(pathTraversalProtection);
app.use(honeypotDetection);

// Rate limiting — with validate:false to suppress X-Forwarded-For warnings
const rlConfig = { standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false } };

app.use('/api/', rateLimit({ ...rlConfig, windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } }));
app.use('/api/auth/login', rateLimit({ ...rlConfig, windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts' } }));
app.use('/api/auth/register', rateLimit({ ...rlConfig, windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many registrations' } }));

// Routes
app.use('/api/auth', strictBodyLimit(10 * 1024), authRoutes);
app.use('/api/users', strictBodyLimit(50 * 1024), userRoutes);
app.use('/api/investments', strictBodyLimit(10 * 1024), investmentRoutes);
app.use('/api/transactions', strictBodyLimit(10 * 1024 * 1024), transactionRoutes); // 10MB for proof images
app.use('/api/gateways', strictBodyLimit(10 * 1024), gatewayRoutes);
app.use('/api/notifications', strictBodyLimit(50 * 1024), notificationRoutes);
app.use('/api', strictBodyLimit(50 * 1024), taskRoutes);
app.use('/api/competitions', strictBodyLimit(50 * 1024), competitionRoutes);
app.use('/api/csv', strictBodyLimit(5 * 1024 * 1024), csvRoutes);
app.use('/api', strictBodyLimit(50 * 1024), slotsLotsRoutes);
app.use('/api/blogs', strictBodyLimit(500 * 1024), blogRoutes);
app.use('/api/wallet', strictBodyLimit(10 * 1024), walletRoutes);
app.use('/api/roi-rates', strictBodyLimit(10 * 1024), roiRatesRoutes);
app.use('/api/settings', strictBodyLimit(5 * 1024 * 1024), settingsRoutes); // 5MB for logo images
app.use('/api/crypto-deposit', strictBodyLimit(10 * 1024), cryptoDepositRoutes);

// Currency conversion (free, no API key) — USD to any currency
app.get('/api/currency/convert', async (req, res) => {
  // Extract and type query params safely using String()
  const from = String(req.query.from || 'USD').trim().toUpperCase();
  const to = String(req.query.to || 'PKR').trim().toUpperCase();
  const amount = parseFloat(String(req.query.amount || '1')) || 1;

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data: any = await response.json();
    const rate: number | undefined = data.rates?.[to];

    if (!rate) {
      return res.status(400).json({ error: `Rate not found for ${from} to ${to}` });
    }

    res.json({ from, to, rate, amount, converted: amount * rate, updated: data.time_last_update_utc || '' });
  } catch (err) {
    console.error('Currency API error:', err);
    // Fallback hardcoded rate
    res.json({ from: 'USD', to: 'PKR', rate: 278.5, amount, converted: amount * 278.5, fallback: true });
  }
});

// Health
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', timestamp: new Date().toISOString() }); }
  catch { res.status(500).json({ status: 'error' }); }
});

// Logout
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true });
});

app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use(globalErrorHandler);

cron.schedule('0 * * * *', () => { console.log('⏰ Profit distribution...'); distributeProfits(); });
cron.schedule('*/2 * * * *', () => { verifyPendingDeposits(); }); // Every 2 minutes
cron.schedule('* * * * *', () => { activatePools(); }); // Every minute — activate filled pools

// ═══════════════════════════════════════════════════════
// FIX #2: Auto-migrate on startup
// Creates all tables if they don't exist, then starts listening
// ═══════════════════════════════════════════════════════
const startServer = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Auto-run migrations (CREATE TABLE IF NOT EXISTS is safe to run repeatedly)
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`🪐 KEPLER432B [${IS_PROD ? 'PRODUCTION' : 'DEV'}] on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
};

// Inline migration — runs all CREATE TABLE IF NOT EXISTS
async function runMigrations() {
  console.log('🔄 Running auto-migrations...');
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255), login_pin VARCHAR(255),
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

    -- Unique index on wallet_address (wallet-only users)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;

    -- Site settings (logo, favicon, etc.)
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investment_plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL, description TEXT, image TEXT,
      min_amount DECIMAL(18,2) DEFAULT 0, max_amount DECIMAL(18,2) DEFAULT 0,
      roi_percentage DECIMAL(8,2) NOT NULL DEFAULT 0, duration_days INT NOT NULL DEFAULT 30,
      pool_target_amount DECIMAL(18,2) DEFAULT 0,
      current_pooled_amount DECIMAL(18,2) DEFAULT 0,
      pool_status VARCHAR(20) DEFAULT 'open' CHECK(pool_status IN ('open','filling','full','started')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS slots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      plan_id UUID NOT NULL REFERENCES investment_plans(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL, description TEXT,
      roi_percentage DECIMAL(8,2) NOT NULL DEFAULT 0, duration_days INT NOT NULL DEFAULT 30,
      min_amount DECIMAL(18,2) DEFAULT 0, max_amount DECIMAL(18,2) DEFAULT 0,
      pool_target_amount DECIMAL(18,2) DEFAULT 0,
      current_pooled_amount DECIMAL(18,2) DEFAULT 0,
      pool_status VARCHAR(20) DEFAULT 'open' CHECK(pool_status IN ('open','filling','full','started')),
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
      pool_target_amount DECIMAL(18,2) DEFAULT 0,
      current_pooled_amount DECIMAL(18,2) DEFAULT 0,
      pool_status VARCHAR(20) DEFAULT 'open' CHECK(pool_status IN ('open','filling','full','started')),
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
      activated_at TIMESTAMPTZ, last_profit_date DATE,
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
      wallet_address VARCHAR(255), chain VARCHAR(50), image TEXT,
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
      reward_amount DECIMAL(18,2) NOT NULL,
      screenshot_url TEXT, status VARCHAR(20) DEFAULT 'pending',
      rejection_reason TEXT, submitted_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
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

    -- DAILY ROI RATES TABLE
    CREATE TABLE IF NOT EXISTS daily_roi_rates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      rate_date DATE NOT NULL UNIQUE,
      roi_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
      note TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- CRYPTO DEPOSITS — on-chain verification tracking
    CREATE TABLE IF NOT EXISTS crypto_deposits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      method VARCHAR(20) NOT NULL,
      cex_order_id VARCHAR(255), cex_checkout_url TEXT, cex_qr_code TEXT,
      chain VARCHAR(50), tx_hash VARCHAR(255) UNIQUE,
      from_address VARCHAR(255), to_address VARCHAR(255),
      token_address VARCHAR(255), token_symbol VARCHAR(20),
      amount_expected DECIMAL(18,6) NOT NULL,
      amount_received DECIMAL(18,6), amount_usd DECIMAL(18,2),
      verification_status VARCHAR(20) DEFAULT 'pending',
      verification_attempts INT DEFAULT 0, verification_error TEXT,
      block_confirmations INT DEFAULT 0, required_confirmations INT DEFAULT 3,
      webhook_payload JSONB, webhook_signature TEXT, webhook_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(), verified_at TIMESTAMPTZ,
      credited_at TIMESTAMPTZ, expired_at TIMESTAMPTZ
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
    CREATE INDEX IF NOT EXISTS idx_crypto_dep_user ON crypto_deposits(user_id);
    CREATE INDEX IF NOT EXISTS idx_crypto_dep_status ON crypto_deposits(verification_status);
    CREATE INDEX IF NOT EXISTS idx_crypto_dep_txhash ON crypto_deposits(tx_hash);
  `);

  // ─── ALTER TABLE: Add missing columns to EXISTING tables ───
  // These are safe to run repeatedly (DO NOTHING if column exists)
  const alterSql = `
    DO $$ BEGIN
      -- investments
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='activated_at') THEN
        ALTER TABLE investments ADD COLUMN activated_at TIMESTAMPTZ;
      END IF;
      -- investment_plans pool fields
      -- investments: add last_profit_date to prevent hourly over-distribution
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='last_profit_date') THEN
        ALTER TABLE investments ADD COLUMN last_profit_date DATE;
      END IF;
      -- investment_plans pool fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investment_plans' AND column_name='pool_target_amount') THEN
        ALTER TABLE investment_plans ADD COLUMN pool_target_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE investment_plans ADD COLUMN current_pooled_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE investment_plans ADD COLUMN pool_status VARCHAR(20) DEFAULT 'open';
        ALTER TABLE investment_plans ADD COLUMN image TEXT;
      END IF;
      -- slots pool fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='slots' AND column_name='pool_target_amount') THEN
        ALTER TABLE slots ADD COLUMN pool_target_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE slots ADD COLUMN current_pooled_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE slots ADD COLUMN pool_status VARCHAR(20) DEFAULT 'open';
      END IF;
      -- lots pool fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lots' AND column_name='pool_target_amount') THEN
        ALTER TABLE lots ADD COLUMN pool_target_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE lots ADD COLUMN current_pooled_amount DECIMAL(18,2) DEFAULT 0;
        ALTER TABLE lots ADD COLUMN pool_status VARCHAR(20) DEFAULT 'open';
      END IF;
      -- users wallet fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_address') THEN
        ALTER TABLE users ADD COLUMN wallet_address VARCHAR(255);
        ALTER TABLE users ADD COLUMN wallet_signature TEXT;
        ALTER TABLE users ADD COLUMN wallet_nonce VARCHAR(255);
      END IF;
      -- transactions crypto fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='chain') THEN
        ALTER TABLE transactions ADD COLUMN chain VARCHAR(50);
        ALTER TABLE transactions ADD COLUMN tx_hash VARCHAR(255);
        ALTER TABLE transactions ADD COLUMN wallet_from VARCHAR(255);
      END IF;
      -- payment_gateways extra fields
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_gateways' AND column_name='wallet_address') THEN
        ALTER TABLE payment_gateways ADD COLUMN wallet_address VARCHAR(255);
        ALTER TABLE payment_gateways ADD COLUMN chain VARCHAR(50);
        ALTER TABLE payment_gateways ADD COLUMN image TEXT;
      END IF;
      -- Make password/login_pin nullable for wallet users
      ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
      ALTER TABLE users ALTER COLUMN login_pin DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ALTER TABLE error (safe to ignore): %', SQLERRM;
    END $$;
  `;
  try { await pool.query(alterSql); } catch (e: any) { console.log('ALTER note:', e.message); }

  console.log('✅ All tables + columns ready');
}

startServer();

export default app;
