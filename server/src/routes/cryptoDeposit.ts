// ═══════════════════════════════════════════════
// CRYPTO DEPOSIT — CEX Pay + Web3 Wallet Verification
// ═══════════════════════════════════════════════
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';
import { verifyWeb3Transaction } from '../utils/web3Verify';
import { createBinancePayOrder, verifyBinanceWebhookSignature, createOKXPayOrder, verifyOKXWebhookSignature } from '../utils/cexPay';

const router = Router();

// ─── WEB3 WALLET: Submit TxHash for verification ───
router.post('/web3/submit', authenticate, async (req: AuthRequest, res) => {
  const { tx_hash, chain, amount, token_symbol } = req.body;
  if (!tx_hash || !chain || !amount) return res.status(400).json({ error: 'tx_hash, chain, and amount required' });
  if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  try {
    // Check duplicate tx_hash
    const dup = await pool.query('SELECT id FROM crypto_deposits WHERE tx_hash = $1', [tx_hash]);
    if (dup.rows.length > 0) return res.status(400).json({ error: 'This transaction has already been submitted' });

    // Create transaction record
    const txnRes = await pool.query(
      `INSERT INTO transactions (user_id,type,amount,payment_method,payment_details,chain,tx_hash,status)
       VALUES ($1,'deposit',$2,'Web3 Wallet',$3,$4,$5,'pending') RETURNING id`,
      [req.user.id, amount, tx_hash, chain, tx_hash]
    );

    // Create crypto_deposit record for verification tracking
    await pool.query(
      `INSERT INTO crypto_deposits (transaction_id,user_id,method,chain,tx_hash,amount_expected,token_symbol,verification_status)
       VALUES ($1,$2,'web3_wallet',$3,$4,$5,$6,'verifying')`,
      [txnRes.rows[0].id, req.user.id, chain, tx_hash, amount, token_symbol || 'USDT']
    );

    await logActivity(req.user.id, 'CRYPTO_DEPOSIT_WEB3', `Web3 deposit: $${amount} on ${chain}, txHash: ${tx_hash}`, req);

    // Immediately attempt verification
    const result = await verifyWeb3Transaction(chain, tx_hash, amount, token_symbol || 'USDT');

    if (result.success) {
      // Auto-credit
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE crypto_deposits SET verification_status='credited', amount_received=$1, from_address=$2,
           to_address=$3, token_address=$4, token_symbol=$5, block_confirmations=$6, verified_at=NOW(), credited_at=NOW()
           WHERE tx_hash=$7`,
          [result.amount, result.fromAddress, result.toAddress, result.tokenAddress, result.tokenSymbol, result.confirmations, tx_hash]
        );
        await client.query("UPDATE transactions SET status='approved' WHERE id=$1", [txnRes.rows[0].id]);
        await client.query('UPDATE users SET balance=balance+$1, updated_at=NOW() WHERE id=$2', [amount, req.user.id]);
        await client.query('COMMIT');
        return res.json({ success: true, status: 'credited', message: 'Deposit verified and credited instantly!' });
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    }

    // Verification pending — will be retried by cron job
    await pool.query(
      `UPDATE crypto_deposits SET verification_error=$1, verification_attempts=1 WHERE tx_hash=$2`,
      [result.error, tx_hash]
    );

    res.json({ success: true, status: 'verifying', message: `Deposit submitted. ${result.error || 'Awaiting blockchain confirmation...'}` });
  } catch (err: any) {
    console.error('Web3 deposit error:', err);
    res.status(500).json({ error: err.message || 'Deposit failed' });
  }
});

// ─── BINANCE PAY: Create order ──────────────────
router.post('/binance/create-order', authenticate, async (req: AuthRequest, res) => {
  const { amount, currency } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const orderId = `K432B-${req.user.id.slice(0,8)}-${Date.now()}`;
    const result = await createBinancePayOrder(amount, currency || 'USDT', orderId, `Kepler432B Deposit $${amount}`);

    if (!result.success) return res.status(400).json({ error: result.error });

    // Create transaction + crypto_deposit records
    const txnRes = await pool.query(
      `INSERT INTO transactions (user_id,type,amount,payment_method,payment_details,status)
       VALUES ($1,'deposit',$2,'Binance Pay',$3,'pending') RETURNING id`,
      [req.user.id, amount, result.orderId]
    );

    await pool.query(
      `INSERT INTO crypto_deposits (transaction_id,user_id,method,cex_order_id,cex_checkout_url,cex_qr_code,amount_expected,token_symbol,verification_status)
       VALUES ($1,$2,'binance_pay',$3,$4,$5,$6,$7,'pending')`,
      [txnRes.rows[0].id, req.user.id, result.orderId, result.checkoutUrl, result.qrCode, amount, currency || 'USDT']
    );

    await logActivity(req.user.id, 'BINANCE_PAY_ORDER', `Binance Pay order: $${amount}`, req);

    res.json({ success: true, orderId: result.orderId, checkoutUrl: result.checkoutUrl, qrCode: result.qrCode });
  } catch (err: any) {
    console.error('Binance Pay error:', err);
    res.status(500).json({ error: 'Failed to create Binance Pay order' });
  }
});

// ─── BINANCE PAY: Webhook (called by Binance servers) ───
router.post('/binance/webhook', async (req: Request, res: Response) => {
  try {
    const timestamp = req.headers['binancepay-timestamp'] as string;
    const nonce = req.headers['binancepay-nonce'] as string;
    const signature = req.headers['binancepay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify signature — CRITICAL security check
    if (!verifyBinanceWebhookSignature(timestamp, nonce, rawBody, signature)) {
      console.error('⚠️ Binance webhook signature FAILED');
      return res.status(403).json({ returnCode: 'FAIL', returnMessage: 'Invalid signature' });
    }

    const { bizType, data } = req.body;
    if (bizType !== 'PAY') return res.json({ returnCode: 'SUCCESS' });

    const { merchantTradeNo, orderAmount, transactAmount, payerInfo } = data || {};

    // Find the crypto_deposit record
    const depRes = await pool.query('SELECT * FROM crypto_deposits WHERE cex_order_id=$1', [merchantTradeNo]);
    if (depRes.rows.length === 0) {
      console.error('⚠️ Binance webhook: order not found:', merchantTradeNo);
      return res.json({ returnCode: 'SUCCESS' });
    }

    const dep = depRes.rows[0];

    // Already processed — idempotency
    if (dep.verification_status === 'credited') {
      return res.json({ returnCode: 'SUCCESS' });
    }

    // Credit user
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE crypto_deposits SET verification_status='credited', amount_received=$1, webhook_payload=$2,
         webhook_signature=$3, webhook_verified=TRUE, verified_at=NOW(), credited_at=NOW() WHERE id=$4`,
        [parseFloat(transactAmount || orderAmount), req.body, signature, dep.id]
      );
      await client.query("UPDATE transactions SET status='approved' WHERE id=$1", [dep.transaction_id]);
      await client.query('UPDATE users SET balance=balance+$1, updated_at=NOW() WHERE id=$2', [parseFloat(dep.amount_expected), dep.user_id]);
      await client.query('COMMIT');
      console.log(`✅ Binance Pay credited: $${dep.amount_expected} to user ${dep.user_id}`);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }

    res.json({ returnCode: 'SUCCESS' });
  } catch (err) {
    console.error('Binance webhook error:', err);
    res.status(500).json({ returnCode: 'FAIL' });
  }
});

// ─── OKX PAY: Create order ──────────────────────
router.post('/okx/create-order', authenticate, async (req: AuthRequest, res) => {
  const { amount, currency } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const orderId = `K432B-${req.user.id.slice(0,8)}-${Date.now()}`;
    const result = await createOKXPayOrder(amount, currency || 'USDT', orderId, `Kepler432B Deposit $${amount}`);

    if (!result.success) return res.status(400).json({ error: result.error });

    const txnRes = await pool.query(
      `INSERT INTO transactions (user_id,type,amount,payment_method,payment_details,status)
       VALUES ($1,'deposit',$2,'OKX Pay',$3,'pending') RETURNING id`,
      [req.user.id, amount, result.orderId]
    );

    await pool.query(
      `INSERT INTO crypto_deposits (transaction_id,user_id,method,cex_order_id,cex_checkout_url,amount_expected,token_symbol,verification_status)
       VALUES ($1,$2,'okx_pay',$3,$4,$5,$6,'pending')`,
      [txnRes.rows[0].id, req.user.id, result.orderId, result.checkoutUrl, amount, currency || 'USDT']
    );

    await logActivity(req.user.id, 'OKX_PAY_ORDER', `OKX Pay order: $${amount}`, req);

    res.json({ success: true, orderId: result.orderId, checkoutUrl: result.checkoutUrl });
  } catch (err: any) {
    console.error('OKX Pay error:', err);
    res.status(500).json({ error: 'Failed to create OKX Pay order' });
  }
});

// ─── OKX PAY: Webhook ───────────────────────────
router.post('/okx/webhook', async (req: Request, res: Response) => {
  try {
    const timestamp = req.headers['ok-access-timestamp'] as string;
    const signature = req.headers['ok-access-sign'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!verifyOKXWebhookSignature(timestamp, rawBody, signature)) {
      console.error('⚠️ OKX webhook signature FAILED');
      return res.status(403).json({ code: 'FAIL' });
    }

    const { merchantOrderNo, orderStatus, orderAmount } = req.body;
    if (orderStatus !== 'PAID') return res.json({ code: 'SUCCESS' });

    const depRes = await pool.query('SELECT * FROM crypto_deposits WHERE cex_order_id=$1', [merchantOrderNo]);
    if (depRes.rows.length === 0) return res.json({ code: 'SUCCESS' });

    const dep = depRes.rows[0];
    if (dep.verification_status === 'credited') return res.json({ code: 'SUCCESS' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE crypto_deposits SET verification_status='credited', amount_received=$1, webhook_payload=$2,
         webhook_signature=$3, webhook_verified=TRUE, verified_at=NOW(), credited_at=NOW() WHERE id=$4`,
        [parseFloat(orderAmount), req.body, signature, dep.id]
      );
      await client.query("UPDATE transactions SET status='approved' WHERE id=$1", [dep.transaction_id]);
      await client.query('UPDATE users SET balance=balance+$1, updated_at=NOW() WHERE id=$2', [parseFloat(dep.amount_expected), dep.user_id]);
      await client.query('COMMIT');
      console.log(`✅ OKX Pay credited: $${dep.amount_expected} to user ${dep.user_id}`);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }

    res.json({ code: 'SUCCESS' });
  } catch (err) {
    console.error('OKX webhook error:', err);
    res.status(500).json({ code: 'FAIL' });
  }
});

// ─── GET user's crypto deposits ─────────────────
router.get('/my-deposits', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT cd.*, t.amount as txn_amount, t.status as txn_status FROM crypto_deposits cd
       LEFT JOIN transactions t ON cd.transaction_id = t.id
       WHERE cd.user_id = $1 ORDER BY cd.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ─── ADMIN: Get all crypto deposits ─────────────
router.get('/all-deposits', authenticate, async (req: AuthRequest, res) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin required' });
  try {
    const result = await pool.query(
      `SELECT cd.*, t.amount as txn_amount, t.status as txn_status, u.name as user_name, u.email as user_email
       FROM crypto_deposits cd
       LEFT JOIN transactions t ON cd.transaction_id = t.id
       LEFT JOIN users u ON cd.user_id = u.id
       ORDER BY cd.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
