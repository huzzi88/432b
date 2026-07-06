// ═══════════════════════════════════════════════
// WALLET AUTH — MetaMask Login/Register
// 
// FLOW:
// 1. GET /nonce?address=0x... → returns nonce + whether user exists
// 2. POST /login → existing user: sign nonce → login
//                 → new wallet + new email: register new account
//                 → new wallet + EXISTING email: LINK wallet to existing account (requires PIN)
// ═══════════════════════════════════════════════
import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../database/db';
import { generateToken, setAuthCookie, authenticate, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// Helper function for formatting user response
function formatUser(user: any) {
  return {
    id: user.id, name: user.name, email: user.email,
    balance: parseFloat(user.balance) || 0, totalInvested: parseFloat(user.total_invested) || 0,
    totalEarnings: parseFloat(user.total_earnings) || 0, totalWithdrawn: parseFloat(user.total_withdrawn) || 0,
    referralCode: user.referral_code, referralCount: user.referral_count || 0,
    referralBonusPercentage: parseFloat(user.referral_bonus_percentage) || 0,
    referralEarnings: parseFloat(user.referral_earnings) || 0,
    kycStatus: user.kyc_status, walletAddress: user.wallet_address,
    isAdmin: user.is_admin, isBlocked: user.is_blocked,
    joinedDate: user.joined_date, phone: user.phone, city: user.city, country: user.country,
  };
}

// ─── GET NONCE ──────────────────────────────────
router.get('/nonce', async (req, res) => {
  const { address } = req.query;
  if (!address || typeof address !== 'string') return res.status(400).json({ error: 'address required' });

  try {
    // Check if wallet is already linked to a user
    const walletUser = await pool.query('SELECT wallet_nonce, email, name FROM users WHERE LOWER(wallet_address) = LOWER($1)', [address]);
    if (walletUser.rows.length > 0) {
      const u = walletUser.rows[0];
      let nonce = u.wallet_nonce;
      if (!nonce) {
        nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await pool.query('UPDATE users SET wallet_nonce = $1 WHERE LOWER(wallet_address) = LOWER($2)', [nonce, address]);
      }
      return res.json({ nonce, exists: true, email: u.email, name: u.name });
    }

    // Wallet not linked yet — generate nonce
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    res.json({ nonce, exists: false });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ─── WALLET LOGIN / REGISTER ────────────────────
router.post('/login', async (req, res) => {
  const { address, signature, nonce, email, name, pin, referral_code } = req.body;
  if (!address || !signature || !nonce) return res.status(400).json({ error: 'address, signature, nonce required' });

  try {
    const addr = address.toLowerCase();

    // ── CASE 1: Wallet already linked to an account → just login
    const walletUser = await pool.query('SELECT * FROM users WHERE LOWER(wallet_address) = $1', [addr]);
    if (walletUser.rows.length > 0) {
      const user = walletUser.rows[0];
      if (user.is_blocked) return res.status(403).json({ error: 'Account blocked' });
      if (user.wallet_nonce !== nonce) return res.status(401).json({ error: 'Nonce expired. Please reconnect wallet.' });

      // Rotate nonce AFTER successful verification to prevent replay attacks
      const newNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const token = generateToken(user.id);
      setAuthCookie(res, token);
      
      // Update nonce after setting cookie (so if update fails, user still logged in for this session)
      await pool.query('UPDATE users SET wallet_nonce = $1, updated_at = NOW() WHERE id = $2', [newNonce, user.id]);
      
      await logActivity(user.id, 'WALLET_LOGIN', `Wallet login: ${addr}`, req);
      return res.json({ token, user: formatUser(user), nonceRotated: true });
    }

    // ── Wallet not linked yet — need email + PIN
    if (!email?.trim()) return res.status(400).json({ error: 'Email required for wallet accounts', needsRegistration: true });
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: '4-digit PIN required', needsRegistration: true });

    const emailLower = email.toLowerCase().trim();

    // ── CASE 2: Email already exists → LINK wallet to existing account (verify PIN first)
    const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [emailLower]);
    if (existingEmail.rows.length > 0) {
      const user = existingEmail.rows[0];
      if (user.is_blocked) return res.status(403).json({ error: 'Account blocked' });

      // Already has a different wallet linked
      if (user.wallet_address && user.wallet_address.toLowerCase() !== addr) {
        return res.status(400).json({ error: 'This email already has a different wallet linked' });
      }

      // Verify PIN to prove ownership of the email account
      if (user.login_pin) {
        const pinMatch = await bcrypt.compare(pin, user.login_pin);
        if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN. Enter the PIN you used when registering with this email.' });
      } else {
        // User has no PIN set - require them to set one first before linking wallet
        return res.status(400).json({ error: 'Please set a PIN in your profile before linking a wallet.' });
      }

      // Link wallet to existing account
      const newNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await pool.query('UPDATE users SET wallet_address=$1, wallet_signature=$2, wallet_nonce=$3, updated_at=NOW() WHERE id=$4',
        [addr, signature, newNonce, user.id]);

      const token = generateToken(user.id);
      setAuthCookie(res, token);
      await logActivity(user.id, 'WALLET_LINKED', `Wallet linked to existing account: ${addr}`, req);
      return res.json({ token, user: formatUser(user), linked: true });
    }

    // ── CASE 3: New email + new wallet → create new account (with transaction for atomicity)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let referredBy: string | null = null;
      if (referral_code) {
        const ref = await client.query('SELECT id, referral_code FROM users WHERE referral_code = $1', [referral_code.toUpperCase()]);
        if (ref.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid referral code' });
        }
        referredBy = referral_code.toUpperCase();
        // Will increment referral count AFTER successful user creation
      }

      const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const pinHash = await bcrypt.hash(pin, ROUNDS);
      const newNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const insertRes = await client.query(
        `INSERT INTO users (wallet_address, wallet_signature, wallet_nonce, name, email, password, login_pin, referral_code, referred_by)
         VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,$8) RETURNING *`,
        [addr, signature, newNonce, name?.trim() || `Wallet:${address.slice(0,6)}...${address.slice(-4)}`, emailLower, pinHash,
         Math.random().toString(36).substring(2, 8).toUpperCase(), referredBy]
      );

      // Increment referral count AFTER successful user creation (within same transaction)
      if (referredBy) {
        await client.query('UPDATE users SET referral_count = referral_count + 1 WHERE referral_code = $1', [referredBy]);
      }

      await client.query('COMMIT');
      
      const user = insertRes.rows[0];
      const token = generateToken(user.id);
      setAuthCookie(res, token);
      await logActivity(user.id, 'WALLET_REGISTER', `New wallet user: ${addr} (${emailLower})`, req);
      res.status(201).json({ token, user: formatUser(user) });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Wallet login error:', err);
    if (err.code === '23505') return res.status(400).json({ error: 'Wallet or email already in use' });
    res.status(500).json({ error: 'Wallet login failed', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// ─── LINK WALLET (authenticated user) ────────────
router.post('/link', authenticate, async (req: AuthRequest, res) => {
  const { address, nonce } = req.body;
  if (!req.user?.id || !address) return res.status(400).json({ error: 'Auth required + address' });

  try {
    const check = await pool.query('SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1) AND id != $2', [address, req.user.id]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Wallet already linked to another account' });

    await pool.query('UPDATE users SET wallet_address = $1, wallet_nonce = $2 WHERE id = $3', [address.toLowerCase(), nonce || null, req.user.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
