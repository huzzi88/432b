// ═══════════════════════════════════════════════════════
// AUTH ROUTES — httpOnly cookie-based authentication
// Token is set as httpOnly cookie, never returned in JSON body
// ═══════════════════════════════════════════════════════
import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../database/db';
import { authenticate, generateToken, setAuthCookie, AuthRequest } from '../middleware/auth';
import { formatUser } from '../utils/formatUser';
import { logActivity } from '../utils/activityLogger';

const router = Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12'); // 12 rounds for production

// ─── REGISTER ────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, login_pin, referral_code } = req.body;

  if (!name || !email || !password || !login_pin) return res.status(400).json({ error: 'All fields required' });
  if (typeof name !== 'string' || name.trim().length < 2) return res.status(400).json({ error: 'Name min 2 chars' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (password.length < 6 || password.length > 128) return res.status(400).json({ error: 'Password 6-128 chars' });
  if (!/^\d{4}$/.test(login_pin)) return res.status(400).json({ error: 'PIN must be 4 digits' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    let referredBy: string | null = null;
    if (referral_code) {
      const ref = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referral_code.toUpperCase()]);
      if (ref.rows.length === 0) return res.status(400).json({ error: 'Invalid referral code' });
      referredBy = referral_code.toUpperCase();
      // Increment referral count AFTER user creation to prevent race condition
    }

    const hashedPw = await bcrypt.hash(password, ROUNDS);
    const hashedPin = await bcrypt.hash(login_pin, ROUNDS);
    const refCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await pool.query(
      'INSERT INTO users (name, email, password, login_pin, referral_code, referred_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name.trim(), email.toLowerCase().trim(), hashedPw, hashedPin, refCode, referredBy]
    );

    // Increment referral count AFTER successful user creation
    if (referredBy) {
      await pool.query('UPDATE users SET referral_count = referral_count + 1 WHERE referral_code = $1', [referredBy]);
    }

    await logActivity(result.rows[0].id, 'REGISTER', `New user: ${email}`, req);
    res.status(201).json({ success: true, user: formatUser(result.rows[0]) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── LOGIN — sets httpOnly cookie ────────────────
router.post('/login', async (req, res) => {
  const { email, password, login_pin } = req.body;
  if (!email || !password || !login_pin) return res.status(400).json({ error: 'All fields required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      await logActivity(null, 'LOGIN_FAILED', `Unknown email: ${email}`, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_blocked) return res.status(403).json({ error: 'Account blocked' });

    // Wallet-only users have no password — can only login via wallet
    if (!user.password || !user.login_pin) {
      return res.status(401).json({ error: 'This account uses wallet login only. Please connect your wallet.' });
    }

    const [pwOk, pinOk] = await Promise.all([
      bcrypt.compare(password, user.password),
      bcrypt.compare(login_pin, user.login_pin),
    ]);

    if (!pwOk || !pinOk) {
      await logActivity(user.id, 'LOGIN_FAILED', `Wrong credentials for: ${email}`, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_admin) {
      await logActivity(user.id, 'ADMIN_LOGIN_STEP1', 'Awaiting admin PINs', req);
      return res.json({ requireAdminPins: true, userId: user.id });
    }

    // Set httpOnly cookie + return user data (NO token in body)
    const token = generateToken(user.id);
    setAuthCookie(res, token);
    await logActivity(user.id, 'LOGIN', `User logged in: ${email}`, req);

    // Also return token in body for backward compatibility with localStorage migration
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── ADMIN PIN VERIFICATION ──────────────────────
router.post('/admin/verify-pins', async (req, res) => {
  const { userId, pin1, pin2, pin3 } = req.body;
  if (!userId || !pin1 || !pin2 || !pin3) return res.status(400).json({ error: 'All 3 PINs required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND is_admin = TRUE', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });

    const admin = result.rows[0];
    if (!admin.admin_pin1 || !admin.admin_pin2 || !admin.admin_pin3) {
      return res.status(400).json({ error: 'Admin PINs not configured' });
    }

    const [m1, m2, m3] = await Promise.all([
      bcrypt.compare(pin1, admin.admin_pin1),
      bcrypt.compare(pin2, admin.admin_pin2),
      bcrypt.compare(pin3, admin.admin_pin3),
    ]);

    if (!m1 || !m2 || !m3) {
      await logActivity(userId, 'ADMIN_PIN_FAILED', 'Invalid admin PINs', req);
      return res.status(401).json({ error: 'Invalid admin PINs' });
    }

    const token = generateToken(admin.id);
    setAuthCookie(res, token);
    await logActivity(admin.id, 'ADMIN_LOGIN', 'Admin logged in', req);
    res.json({ token, user: formatUser(admin) });
  } catch (err) {
    console.error('Admin verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── GET PROFILE (session restore on refresh) ────
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    // Load full user data for profile
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(result.rows[0]) });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
