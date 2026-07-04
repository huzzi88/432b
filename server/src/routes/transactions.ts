import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// DEPOSIT — screenshot compulsory, TRX ID optional
router.post('/deposit', authenticate, async (req: AuthRequest, res) => {
  const { amount, payment_method, payment_details, chain, tx_hash, wallet_from, proof_image } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!payment_method) return res.status(400).json({ error: 'Payment method required' });
  if (!proof_image || !proof_image.trim()) return res.status(400).json({ error: 'Payment receipt screenshot is required' });

  // Validate image format
  if (!proof_image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image format. Must be JPEG or PNG.' });
  }
  if (proof_image.length > 7000000) {
    return res.status(400).json({ error: 'Image too large. Max 5MB.' });
  }

  try {
    await pool.query(
      "INSERT INTO transactions (user_id,type,amount,payment_method,payment_details,proof_image,chain,tx_hash,wallet_from,status) VALUES ($1,'deposit',$2,$3,$4,$5,$6,$7,$8,'pending')",
      [req.user.id, amount, payment_method, payment_details||null, proof_image.trim(), chain||null, tx_hash||null, wallet_from||null]
    );
    await logActivity(req.user.id, 'DEPOSIT_REQUEST', `Deposit $${amount} via ${payment_method}${chain?` on ${chain}`:''}${payment_details?` [Ref: ${payment_details}]`:' [No TRX ID]'}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// WITHDRAW — supports bank + crypto. KYC + PIN required.
router.post('/withdraw', authenticate, async (req: AuthRequest, res) => {
  const { amount, payment_method, payment_details, login_pin, chain, wallet_address } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!payment_method) return res.status(400).json({ error: 'Payment method required' });
  if (!login_pin) return res.status(400).json({ error: 'Login PIN required for withdrawal' });
  if (!payment_details?.trim()) return res.status(400).json({ error: 'Account/wallet details required' });

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = userRes.rows[0];

    if (user.kyc_status !== 'verified') {
      return res.status(403).json({ error: 'KYC verification required before withdrawal.' });
    }

    // Wallet users may not have login_pin — use wallet_address as alt verification
    if (user.login_pin) {
      const pinMatch = await bcrypt.compare(login_pin, user.login_pin);
      if (!pinMatch) return res.status(401).json({ error: 'Invalid login PIN' });
    } else if (user.wallet_address) {
      // Wallet-only user — PIN is the last 4 chars of wallet address
      if (login_pin !== user.wallet_address.slice(-4)) {
        return res.status(401).json({ error: 'Invalid verification code' });
      }
    } else {
      return res.status(401).json({ error: 'No PIN configured' });
    }

    if (parseFloat(user.balance) < amount) return res.status(400).json({ error: 'Insufficient balance' });

    await pool.query(
      "INSERT INTO transactions (user_id,type,amount,payment_method,payment_details,chain,wallet_from,status) VALUES ($1,'withdrawal',$2,$3,$4,$5,$6,'pending')",
      [req.user.id, amount, payment_method, payment_details.trim(), chain || null, wallet_address || user.wallet_address || null]
    );
    await logActivity(req.user.id, 'WITHDRAW_REQUEST', `Withdrawal $${amount} via ${payment_method}${chain ? ` on ${chain}` : ''}`, req);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// MY TRANSACTIONS
router.get('/my-transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE user_id=$1 ORDER BY date DESC', [req.user.id]);
    res.json(result.rows.map(r => ({ id: r.id, userId: r.user_id, type: r.type, amount: parseFloat(r.amount), status: r.status, paymentMethod: r.payment_method, paymentDetails: r.payment_details, proofImage: r.proof_image, chain: r.chain, txHash: r.tx_hash, walletFrom: r.wallet_from, notes: r.notes, date: r.date })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ALL TRANSACTIONS (admin)
router.get('/all-transactions', authenticate, adminOnly, async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const type = req.query.type ? String(req.query.type) : undefined;
  let sql = 'SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t LEFT JOIN users u ON t.user_id=u.id WHERE 1=1';
  const vals: any[] = []; let i = 1;
  if (status) { sql += ` AND t.status=$${i++}`; vals.push(status); }
  if (type) { sql += ` AND t.type=$${i++}`; vals.push(type); }
  sql += ' ORDER BY t.date DESC';
  try {
    const result = await pool.query(sql, vals);
    res.json(result.rows.map(r => ({ id: r.id, userId: r.user_id, type: r.type, amount: parseFloat(r.amount), status: r.status, paymentMethod: r.payment_method, paymentDetails: r.payment_details, proofImage: r.proof_image, chain: r.chain, txHash: r.tx_hash, walletFrom: r.wallet_from, notes: r.notes, date: r.date })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// UPDATE TRANSACTION (admin approve/reject)
router.put('/transactions/:id', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!status || !['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txnRes = await client.query('SELECT * FROM transactions WHERE id=$1', [id]);
    if (txnRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const txn = txnRes.rows[0];
    if (txn.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already processed' }); }

    await client.query('UPDATE transactions SET status=$1, notes=COALESCE($2,notes), updated_at=NOW() WHERE id=$3', [status, notes, id]);

    if (status === 'approved') {
      if (txn.type === 'deposit') {
        await client.query('UPDATE users SET balance=balance+$1, updated_at=NOW() WHERE id=$2', [parseFloat(txn.amount), txn.user_id]);
      } else if (txn.type === 'withdrawal') {
        await client.query('UPDATE users SET balance=balance-$1, total_withdrawn=total_withdrawn+$1, updated_at=NOW() WHERE id=$2', [parseFloat(txn.amount), txn.user_id]);
      }
    }
    await client.query('COMMIT');
    await logActivity(req.user.id, `TXN_${status.toUpperCase()}`, `Admin ${status} ${txn.type} $${txn.amount}`, req);
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ error: 'Failed' }); }
  finally { client.release(); }
});

// DASHBOARD STATS (admin)
router.get('/dashboard-stats', authenticate, adminOnly, async (_req, res) => {
  try {
    const stats = await pool.query(`SELECT
      (SELECT COUNT(*) FROM users WHERE is_admin=FALSE) as total_users,
      (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='deposit' AND status='approved') as total_deposits,
      (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='withdrawal' AND status='approved') as total_withdrawals,
      (SELECT COUNT(*) FROM investments WHERE status='active') as active_investments,
      (SELECT COUNT(*) FROM investments WHERE status='pending') as pending_investments,
      (SELECT COUNT(*) FROM transactions WHERE status='pending') as pending_transactions,
      (SELECT COUNT(*) FROM kyc_documents WHERE status='pending') as pending_kyc`);
    res.json({ stats: stats.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
