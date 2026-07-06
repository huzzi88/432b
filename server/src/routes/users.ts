import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import { formatUser } from '../utils/formatUser';
import { logActivity } from '../utils/activityLogger';

const router = Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// GET all users (admin)
router.get('/all-users', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows.map(formatUser));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// UPDATE user balance (admin)
router.put('/users/:id/balance', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { amount, type } = req.body;
  if (!amount || !type) return res.status(400).json({ error: 'amount and type required' });
  if (!['add', 'subtract'].includes(type)) return res.status(400).json({ error: 'type must be add or subtract' });
  
  const op = type === 'add' ? '+' : '-';
  try {
    // Use parameterized query - op is validated above and safe to use in SQL syntax
    // The operator is hardcoded based on validated input, not user-controlled
    const operator = type === 'add' ? '+' : '-';
    await pool.query(`UPDATE users SET balance = balance ${operator} $1, updated_at = NOW() WHERE id = $2`, [Math.abs(amount), id]);
    await logActivity(req.user.id, 'BALANCE_UPDATE', `Admin ${type} $${amount} for user ${id}`, req);
    res.json({ success: true });
  } catch (err: any) { 
    console.error('Balance update error:', err); 
    res.status(500).json({ error: 'Failed to update balance' }); 
  }
});

// BLOCK / UNBLOCK user (admin)
router.put('/users/:id/block', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET is_blocked = NOT is_blocked, updated_at = NOW() WHERE id = $1', [id]);
    await logActivity(req.user.id, 'USER_BLOCK_TOGGLE', `Admin toggled block for user ${id}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ADMIN UPDATE USER (wallet, phone, KYC status, etc.)
router.put('/users/:id/update', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { phone, city, country, kyc_status, wallet_address, wallet_nonce, is_blocked } = req.body;
  try {
    const updates: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (phone !== undefined) { updates.push(`phone=$${i++}`); vals.push(phone); }
    if (city !== undefined) { updates.push(`city=$${i++}`); vals.push(city); }
    if (country !== undefined) { updates.push(`country=$${i++}`); vals.push(country); }
    if (kyc_status !== undefined) { updates.push(`kyc_status=$${i++}`); vals.push(kyc_status); }
    if (wallet_address !== undefined) { updates.push(`wallet_address=$${i++}`); vals.push(wallet_address); }
    if (wallet_nonce !== undefined) { updates.push(`wallet_nonce=$${i++}`); vals.push(wallet_nonce); }
    if (is_blocked !== undefined) { updates.push(`is_blocked=$${i++}`); vals.push(is_blocked); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at=NOW()`);
    vals.push(id);
    await pool.query(`UPDATE users SET ${updates.join(',')} WHERE id=$${i}`, vals);
    await logActivity(req.user.id, 'ADMIN_USER_UPDATE', `Admin updated user ${id}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET wallet-only users (admin)
router.get('/wallet-users', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, wallet_address, wallet_nonce, balance, total_invested, total_earnings,
              kyc_status, is_blocked, created_at
       FROM users WHERE wallet_address IS NOT NULL ORDER BY created_at DESC`
    );
    res.json(result.rows.map(r => ({
      id: r.id, name: r.name, email: r.email,
      walletAddress: r.wallet_address, walletNonce: r.wallet_nonce,
      balance: parseFloat(r.balance), totalInvested: parseFloat(r.total_invested),
      totalEarnings: parseFloat(r.total_earnings),
      kycStatus: r.kyc_status, isBlocked: r.is_blocked,
      createdAt: r.created_at,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// SUBMIT KYC (user) — requires CNIC number + front image
router.post('/kyc/submit', authenticate, async (req: AuthRequest, res) => {
  const { cnic_number, cnic_front_image } = req.body;
  if (!cnic_number?.trim()) return res.status(400).json({ error: 'CNIC number required' });
  if (!cnic_front_image?.trim()) return res.status(400).json({ error: 'CNIC front image is required (upload or take photo)' });

  // Validate image format and size
  if (!cnic_front_image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image format. Must be a JPEG or PNG image.' });
  }

  // Max 2MB base64 encoded image (stricter limit for security)
  const MAX_IMAGE_SIZE = 2000000;
  if (cnic_front_image.length > MAX_IMAGE_SIZE) {
    return res.status(400).json({ error: 'Image too large. Max 2MB.' });
  }

  try {
    // Check if already pending - validate uniqueness of submission
    const existing = await pool.query("SELECT cnic_number, cnic_front_image FROM kyc_documents WHERE user_id = $1 AND status = 'pending'", [req.user.id]);
    if (existing.rows.length > 0) {
      const existingCnic = existing.rows[0].cnic_number;
      const existingImage = existing.rows[0].cnic_front_image;
      
      // Only allow update if CNIC or image is actually different
      if (cnic_number.trim() !== existingCnic || cnic_front_image !== existingImage) {
        await pool.query("UPDATE kyc_documents SET cnic_number = $1, cnic_front_image = $2, updated_at = NOW() WHERE user_id = $3 AND status = 'pending'",
          [cnic_number.trim(), cnic_front_image, req.user.id]);
      } else {
        // Same data submitted again - return success without updating
        return res.json({ success: true, message: 'KYC already pending with same data' });
      }
    } else {
      // Create new KYC document
      await pool.query('INSERT INTO kyc_documents (user_id, cnic_number, cnic_front_image) VALUES ($1, $2, $3)',
        [req.user.id, cnic_number.trim(), cnic_front_image]);
    }

    // Update user's cnic + status
    await pool.query("UPDATE users SET cnic_number = $1, kyc_status = 'pending', updated_at = NOW() WHERE id = $2",
      [cnic_number.trim(), req.user.id]);

    await logActivity(req.user.id, 'KYC_SUBMIT', `KYC submitted with image: ${cnic_number}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'KYC submission failed' }); }
});

// GET pending KYC (admin)
router.get('/kyc/pending', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*, u.name as user_name, u.email as user_email FROM kyc_documents k JOIN users u ON k.user_id = u.id WHERE k.status = 'pending' ORDER BY k.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET all KYC docs (admin)
router.get('/kyc/all', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*, u.name as user_name, u.email as user_email FROM kyc_documents k JOIN users u ON k.user_id = u.id ORDER BY k.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// REVIEW KYC (admin approve/reject)
router.put('/kyc/review/:user_id', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { user_id } = req.params;
  const { status, rejection_reason } = req.body;
  if (!status || !['verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.query('UPDATE users SET kyc_status = $1, updated_at = NOW() WHERE id = $2', [status, user_id]);
    await pool.query('UPDATE kyc_documents SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW() WHERE user_id = $4 AND status = \'pending\'',
      [status, rejection_reason || null, req.user.id, user_id]);
    await logActivity(req.user.id, 'KYC_REVIEW', `Admin ${status} KYC for user ${user_id}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// UPDATE PROFILE (user)
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  const { name, phone, address, city, country, date_of_birth, gender, occupation } = req.body;
  try {
    await pool.query(
      `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), address=COALESCE($3,address),
       city=COALESCE($4,city), country=COALESCE($5,country), date_of_birth=COALESCE($6,date_of_birth),
       gender=COALESCE($7,gender), occupation=COALESCE($8,occupation), updated_at=NOW() WHERE id=$9`,
      [name, phone, address, city, country, date_of_birth, gender, occupation, req.user.id]
    );
    const updated = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    await logActivity(req.user.id, 'PROFILE_UPDATE', 'User updated profile', req);
    res.json({ success: true, user: formatUser(updated.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// FORGOT PASSWORD (verify by phone or CNIC → reset to temp password)
router.post('/forgot-password', async (req, res) => {
  const { email, phone, cnic_number } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!phone && !cnic_number) return res.status(400).json({ error: 'Phone or CNIC required for verification' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    let verified = false;

    if (phone && user.phone) {
      if (user.phone === phone.trim()) verified = true;
      else return res.status(400).json({ error: 'Phone number does not match' });
    }
    if (!verified && cnic_number && user.cnic_number) {
      if (user.cnic_number === cnic_number.trim()) verified = true;
      else return res.status(400).json({ error: 'CNIC number does not match' });
    }
    if (!verified) return res.status(400).json({ error: 'No matching phone or CNIC on this account. Update your profile first.' });

    // Reset password to "123456"
    const tempPw = await bcrypt.hash('123456', parseInt(process.env.BCRYPT_ROUNDS || '10'));
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [tempPw, user.id]);
    await logActivity(user.id, 'PASSWORD_RESET', `Password reset via forgot password for ${email}`, req);

    res.json({ success: true, message: 'Password reset to: 123456. Please login and change it immediately.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ─── REFERRAL TRACKING (admin) — who referred whom, with deposit history ───
router.get('/referrals', authenticate, adminOnly, async (_req, res) => {
  try {
    // Get all users with their referrer info
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.referred_by, u.referral_code, u.referral_count,
        u.referral_earnings, u.balance, u.total_invested, u.total_earnings,
        u.joined_date,
        ref.name as referrer_name, ref.email as referrer_email
      FROM users u
      LEFT JOIN users ref ON u.referred_by = ref.referral_code
      WHERE u.is_admin = FALSE
      ORDER BY u.joined_date DESC
    `);

    // Get all referral earnings with details
    const earningsRes = await pool.query(`
      SELECT re.*, 
        r.name as referrer_name, r.email as referrer_email,
        u.name as referred_name, u.email as referred_email
      FROM referral_earnings re
      JOIN users r ON re.referrer_id = r.id
      JOIN users u ON re.referred_user_id = u.id
      ORDER BY re.created_at DESC
      LIMIT 100
    `);

    // Get deposit history for each referred user
    const depositsRes = await pool.query(`
      SELECT t.user_id, u.name as user_name, u.email as user_email,
        t.amount, t.status, t.date, t.payment_method
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'deposit'
      ORDER BY t.date DESC
    `);

    res.json({
      users: result.rows.map(r => ({
        id: r.id, name: r.name, email: r.email,
        referredBy: r.referred_by, referrerName: r.referrer_name, referrerEmail: r.referrer_email,
        referralCode: r.referral_code, referralCount: r.referral_count,
        referralEarnings: parseFloat(r.referral_earnings) || 0,
        balance: parseFloat(r.balance), totalInvested: parseFloat(r.total_invested),
        totalEarnings: parseFloat(r.total_earnings), joinedDate: r.joined_date,
      })),
      earnings: earningsRes.rows.map(r => ({
        id: r.id, referrerName: r.referrer_name, referrerEmail: r.referrer_email,
        referredName: r.referred_name, referredEmail: r.referred_email,
        tier: r.tier, amount: parseFloat(r.amount), date: r.created_at,
      })),
      deposits: depositsRes.rows.map(r => ({
        userId: r.user_id, userName: r.user_name, userEmail: r.user_email,
        amount: parseFloat(r.amount), status: r.status, date: r.date, method: r.payment_method,
      })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
