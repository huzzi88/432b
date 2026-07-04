// ═══════════════════════════════════════════════
// PROFIT DISTRIBUTION — Hourly cron, distributes ONCE per day
//
// CRITICAL: Uses last_profit_date to ensure each investment
// only gets profit credited ONCE per calendar day.
//
// FLOW:
// 1. Admin sets daily ROI% via ROI tab → stored in daily_roi_rates
// 2. Cron runs every hour but checks last_profit_date < CURRENT_DATE
// 3. Profit = (investment_amount × admin_daily_roi%) / 100
// 4. If earned_profit + today's profit >= total_profit → complete
// 5. On completion: principal returned to user balance
// ═══════════════════════════════════════════════
import pool from '../database/db';

export const distributeProfits = async () => {
  const client = await pool.connect();
  let distributed = 0;
  let totalAmount = 0;
  let completed = 0;

  try {
    // 1. Get the LATEST ROI rate set by admin (for today or earlier)
    const rateRes = await client.query(
      `SELECT roi_percentage, rate_date FROM daily_roi_rates
       WHERE rate_date <= CURRENT_DATE
       ORDER BY rate_date DESC LIMIT 1`
    );

    if (rateRes.rows.length === 0) {
      // No ROI rate set yet — skip silently
      return;
    }

    const roiPct = parseFloat(rateRes.rows[0].roi_percentage);
    if (roiPct <= 0) return; // 0% = skip

    await client.query('BEGIN');

    // 2. Get active investments that have NOT been credited today
    //    AND whose start_date is in the past (not same-day investments)
    const invRes = await client.query(`
      SELECT i.id, i.user_id, i.amount, i.earned_profit, i.total_profit,
             i.start_date, i.last_profit_date
      FROM investments i
      WHERE i.status = 'active'
        AND i.start_date::date < CURRENT_DATE
        AND (i.last_profit_date IS NULL OR i.last_profit_date < CURRENT_DATE)
    `);

    for (const inv of invRes.rows) {
      const invAmt = parseFloat(inv.amount);
      const earned = parseFloat(inv.earned_profit);
      const maxProfit = parseFloat(inv.total_profit);

      // Calculate daily return using admin's rate
      const dailyReturn = (invAmt * roiPct) / 100;

      // Cap at remaining profit (don't over-distribute)
      const headroom = maxProfit - earned;
      const actualReturn = Math.min(dailyReturn, Math.max(headroom, 0));

      if (actualReturn <= 0.001) {
        // Mark as credited today even if 0 (prevents re-checking)
        await client.query(
          'UPDATE investments SET last_profit_date = CURRENT_DATE WHERE id = $1',
          [inv.id]
        );
        continue;
      }

      // 3. Credit daily profit
      await client.query(
        'UPDATE investments SET earned_profit = earned_profit + $1, last_profit_date = CURRENT_DATE, updated_at = NOW() WHERE id = $2',
        [actualReturn, inv.id]
      );
      await client.query(
        'UPDATE users SET balance = balance + $1, total_earnings = total_earnings + $1, updated_at = NOW() WHERE id = $2',
        [actualReturn, inv.user_id]
      );
      await client.query(
        `INSERT INTO profit_distribution_logs (investment_id, user_id, amount, investment_status)
         VALUES ($1, $2, $3, 'active')`,
        [inv.id, inv.user_id, actualReturn]
      );

      // Also create a transaction record so user sees it
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, status, notes, date)
         VALUES ($1, 'profit', $2, 'approved', 'Daily ROI profit', NOW())`,
        [inv.user_id, actualReturn]
      );

      distributed++;
      totalAmount += actualReturn;
    }

    // 4. Auto-complete investments that reached total_profit
    //    Return principal to user balance
    const completedRes = await client.query(`
      SELECT id, user_id, amount FROM investments
      WHERE status = 'active' AND earned_profit >= total_profit
    `);

    for (const ci of completedRes.rows) {
      const principal = parseFloat(ci.amount);
      await client.query("UPDATE investments SET status = 'completed', updated_at = NOW() WHERE id = $1", [ci.id]);
      await client.query(
        'UPDATE users SET balance = balance + $1, total_invested = GREATEST(0, total_invested - $1), updated_at = NOW() WHERE id = $2',
        [principal, ci.user_id]
      );
      await client.query(
        "INSERT INTO transactions (user_id, type, amount, status, notes) VALUES ($1, 'profit', $2, 'approved', 'Investment completed — principal returned')",
        [ci.user_id, principal]
      );
      completed++;
    }

    await client.query('COMMIT');

    if (distributed > 0 || completed > 0) {
      console.log(`✅ Profit: ${distributed} credited ($${totalAmount.toFixed(4)}), ${completed} completed`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Profit distribution error:', err);
  } finally {
    client.release();
  }
};
