// ═══════════════════════════════════════════════
// VERIFY PENDING CRYPTO DEPOSITS
// Cron job — retries Web3 verification every 2 minutes
// Expires CEX orders after 30 minutes
// ═══════════════════════════════════════════════
import pool from '../database/db';
import { verifyWeb3Transaction } from '../utils/web3Verify';

export const verifyPendingDeposits = async () => {
  const client = await pool.connect();

  try {
    // 1. Retry Web3 deposits in 'verifying' status (max 30 attempts)
    const pending = await client.query(`
      SELECT * FROM crypto_deposits
      WHERE method = 'web3_wallet'
        AND verification_status = 'verifying'
        AND verification_attempts < 30
      ORDER BY created_at ASC
      LIMIT 20
    `);

    for (const dep of pending.rows) {
      try {
        const result = await verifyWeb3Transaction(
          dep.chain,
          dep.tx_hash,
          parseFloat(dep.amount_expected),
          dep.token_symbol || 'USDT'
        );

        if (result.success) {
          // Credit user
          await client.query('BEGIN');
          await client.query(
            `UPDATE crypto_deposits SET verification_status='credited', amount_received=$1, from_address=$2,
             to_address=$3, token_address=$4, token_symbol=$5, block_confirmations=$6,
             verification_attempts=verification_attempts+1, verified_at=NOW(), credited_at=NOW()
             WHERE id=$7`,
            [result.amount, result.fromAddress, result.toAddress, result.tokenAddress,
             result.tokenSymbol, result.confirmations, dep.id]
          );
          await client.query("UPDATE transactions SET status='approved' WHERE id=$1", [dep.transaction_id]);
          await client.query('UPDATE users SET balance=balance+$1, updated_at=NOW() WHERE id=$2',
            [parseFloat(dep.amount_expected), dep.user_id]);
          await client.query('COMMIT');
          console.log(`✅ Verified Web3 deposit: $${dep.amount_expected} for user ${dep.user_id}`);
        } else {
          // Update attempt count + error
          await client.query(
            `UPDATE crypto_deposits SET verification_attempts=verification_attempts+1, verification_error=$1 WHERE id=$2`,
            [result.error, dep.id]
          );
        }
      } catch (err: any) {
        await client.query(
          `UPDATE crypto_deposits SET verification_attempts=verification_attempts+1, verification_error=$1 WHERE id=$2`,
          [err.message, dep.id]
        );
      }
    }

    // 2. Mark Web3 deposits as failed after 30 attempts
    await client.query(`
      UPDATE crypto_deposits SET verification_status='failed', verification_error='Max attempts reached'
      WHERE method='web3_wallet' AND verification_status='verifying' AND verification_attempts >= 30
    `);

    // 3. Expire CEX orders after 30 minutes
    await client.query(`
      UPDATE crypto_deposits SET verification_status='expired', expired_at=NOW()
      WHERE method IN ('binance_pay','okx_pay')
        AND verification_status='pending'
        AND created_at < NOW() - INTERVAL '30 minutes'
    `);

    if (pending.rows.length > 0) {
      console.log(`🔄 Processed ${pending.rows.length} pending crypto deposits`);
    }
  } catch (err) {
    console.error('❌ Verify pending deposits error:', err);
  } finally {
    client.release();
  }
};
