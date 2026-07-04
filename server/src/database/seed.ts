import pool from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const seed = async () => {
  console.log('🌱 Seeding database...');

  try {
    // ─── Admin user ──────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kepler432b.com';
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length === 0) {
      const pw = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', ROUNDS);
      const pin = await bcrypt.hash(process.env.ADMIN_PIN || '1234', ROUNDS);
      const p1 = await bcrypt.hash(process.env.ADMIN_PIN1 || 'pin1', ROUNDS);
      const p2 = await bcrypt.hash(process.env.ADMIN_PIN2 || 'pin2', ROUNDS);
      const p3 = await bcrypt.hash(process.env.ADMIN_PIN3 || 'pin3', ROUNDS);

      await pool.query(`
        INSERT INTO users (name, email, password, login_pin, referral_code, kyc_status, is_admin, admin_pin1, admin_pin2, admin_pin3)
        VALUES ($1, $2, $3, $4, $5, 'verified', TRUE, $6, $7, $8)
      `, [process.env.ADMIN_NAME || 'System Admin', adminEmail, pw, pin, 'ADMIN01', p1, p2, p3]);

      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      console.log('ℹ️  Admin already exists, skipping.');
    }

    // ─── Default plans ──────────────────────────
    const plansExist = await pool.query('SELECT id FROM investment_plans LIMIT 1');
    if (plansExist.rows.length === 0) {
      await pool.query(`
        INSERT INTO investment_plans (name, description, min_amount, max_amount, roi_percentage, duration_days) VALUES
        ('Starter Plan', '3% return in 30 days', 10, 500, 3, 30),
        ('Growth Plan',  '5% return in 30 days', 100, 5000, 5, 30),
        ('Premium Plan', '8% return in 60 days', 500, 50000, 8, 60)
      `);
      console.log('✅ Default plans seeded.');
    }

    // ─── Default gateways ────────────────────────
    const gwExist = await pool.query('SELECT id FROM payment_gateways LIMIT 1');
    if (gwExist.rows.length === 0) {
      await pool.query(`
        INSERT INTO payment_gateways (name, type, account_details, icon) VALUES
        ('JazzCash',       'jazzcash',  '03XX-XXXXXXX',   '📱'),
        ('EasyPaisa',      'easypaisa', '03XX-XXXXXXX',   '💳'),
        ('Bank Transfer',  'bank',      'IBAN: XXXX-XXXX','🏦'),
        ('USDT (TRC20)',   'crypto',    'TXxxxxxxxxx',    '₮')
      `);
      console.log('✅ Default gateways seeded.');
    }

    // ─── Welcome notification ────────────────────
    const notifExist = await pool.query('SELECT id FROM notifications LIMIT 1');
    if (notifExist.rows.length === 0) {
      await pool.query(`
        INSERT INTO notifications (title, message) VALUES
        ('Welcome to Kepler432B', 'Start investing today! Explore our plans and grow your wealth.')
      `);
      console.log('✅ Welcome notification seeded.');
    }

    console.log('🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
};

seed();
