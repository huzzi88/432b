// ═══════════════════════════════════════════════
// POOL ACTIVATION — Runs every minute
// When a Plan/Slot/Lot pool fills up (amount or persons),
// all 'pooled' investments get activated simultaneously
// ═══════════════════════════════════════════════
import pool from '../database/db';

export const activatePools = async () => {
  const client = await pool.connect();
  try {
    // 1. Check PLANS — activate when pooled amount >= pool_target_amount
    const plans = await client.query(`
      SELECT p.id, p.pool_target_amount, p.duration_days,
        COALESCE(SUM(i.amount), 0) as pooled_sum
      FROM investment_plans p
      LEFT JOIN investments i ON i.plan_id = p.id AND i.invest_level = 'plan' AND i.status = 'pooled'
      WHERE p.pool_target_amount > 0 AND p.pool_status IN ('open','filling')
      GROUP BY p.id
    `);

    for (const p of plans.rows) {
      const target = parseFloat(p.pool_target_amount);
      const current = parseFloat(p.pooled_sum);
      const pct = target > 0 ? (current / target) * 100 : 0;
      const status = current > 0 ? 'filling' : 'open';
      await client.query('UPDATE investment_plans SET current_pooled_amount=$1, pool_status=$2 WHERE id=$3', [current, pct >= 100 ? 'full' : status, p.id]);

      if (current >= target) {
        // Pool full — activate all pooled investments for this plan
        const endDate = new Date(Date.now() + p.duration_days * 86400000);
        await client.query(
          "UPDATE investments SET status='active', start_date=NOW(), end_date=$1, activated_at=NOW() WHERE plan_id=$2 AND invest_level='plan' AND status='pooled'",
          [endDate, p.id]
        );
        await client.query("UPDATE investment_plans SET pool_status='started' WHERE id=$1", [p.id]);
        console.log(`✅ Plan pool activated: ${p.id} (${current}/${target})`);
      }
    }

    // 2. Check SLOTS
    const slots = await client.query(`
      SELECT s.id, s.pool_target_amount, s.duration_days,
        COALESCE(SUM(i.amount), 0) as pooled_sum
      FROM slots s
      LEFT JOIN investments i ON i.slot_id = s.id AND i.invest_level = 'slot' AND i.status = 'pooled'
      WHERE s.pool_target_amount > 0 AND s.pool_status IN ('open','filling')
      GROUP BY s.id
    `);

    for (const s of slots.rows) {
      const target = parseFloat(s.pool_target_amount);
      const current = parseFloat(s.pooled_sum);
      await client.query('UPDATE slots SET current_pooled_amount=$1, pool_status=$2 WHERE id=$3',
        [current, current >= target ? 'full' : current > 0 ? 'filling' : 'open', s.id]);

      if (current >= target) {
        const endDate = new Date(Date.now() + s.duration_days * 86400000);
        await client.query("UPDATE investments SET status='active', start_date=NOW(), end_date=$1, activated_at=NOW() WHERE slot_id=$2 AND invest_level='slot' AND status='pooled'", [endDate, s.id]);
        await client.query("UPDATE slots SET pool_status='started' WHERE id=$1", [s.id]);
        console.log(`✅ Slot pool activated: ${s.id}`);
      }
    }

    // 3. Check LOTS — activate when persons full OR pooled amount >= lot_size
    const lots = await client.query(`
      SELECT l.id, l.lot_size, l.max_persons, l.current_persons, l.duration_days,
        COALESCE(SUM(i.amount), 0) as pooled_sum
      FROM lots l
      LEFT JOIN investments i ON i.lot_id = l.id AND i.invest_level = 'lot' AND i.status = 'pooled'
      WHERE l.pool_status IN ('open','filling')
      GROUP BY l.id
    `);

    for (const l of lots.rows) {
      const current = parseFloat(l.pooled_sum);
      const persons = l.current_persons;
      const sizeReached = l.lot_size > 0 && current >= parseFloat(l.lot_size);
      const personsReached = persons >= l.max_persons;

      await client.query('UPDATE lots SET current_pooled_amount=$1, pool_status=$2 WHERE id=$3',
        [current, (sizeReached || personsReached) ? 'full' : current > 0 ? 'filling' : 'open', l.id]);

      if (sizeReached || personsReached) {
        const endDate = new Date(Date.now() + l.duration_days * 86400000);
        await client.query("UPDATE investments SET status='active', start_date=NOW(), end_date=$1, activated_at=NOW() WHERE lot_id=$2 AND invest_level='lot' AND status='pooled'", [endDate, l.id]);
        await client.query("UPDATE lots SET pool_status='started' WHERE id=$1", [l.id]);
        console.log(`✅ Lot pool activated: ${l.id}`);
      }
    }
  } catch (err) {
    console.error('❌ Pool activation error:', err);
  } finally {
    client.release();
  }
};
