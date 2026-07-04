import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET plans
router.get('/plans', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM investment_plans ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      id: r.id, name: r.name, description: r.description, image: r.image,
      minAmount: parseFloat(r.min_amount), maxAmount: parseFloat(r.max_amount),
      roiPercentage: parseFloat(r.roi_percentage), durationDays: r.duration_days, isActive: r.is_active,
      poolTargetAmount: parseFloat(r.pool_target_amount)||0,
      currentPooledAmount: parseFloat(r.current_pooled_amount)||0,
      poolStatus: r.pool_status||'open',
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/plans', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { name, description, image, min_amount, max_amount, roi_percentage, duration_days, pool_target_amount } = req.body;
  if (!name || !roi_percentage) return res.status(400).json({ error: 'name and roi required' });
  try {
    await pool.query('INSERT INTO investment_plans (name,description,image,min_amount,max_amount,roi_percentage,duration_days,pool_target_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [name, description||'', image||null, min_amount||0, max_amount||0, roi_percentage, duration_days||30, pool_target_amount||0]);
    await logActivity(req.user.id, 'PLAN_CREATED', `Created: ${name}`, req);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/plans/:id', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { name, description, min_amount, max_amount, roi_percentage, duration_days, is_active, pool_target_amount } = req.body;
  try {
    await pool.query(
      `UPDATE investment_plans SET name=COALESCE($1,name),description=COALESCE($2,description),min_amount=COALESCE($3,min_amount),
       max_amount=COALESCE($4,max_amount),roi_percentage=COALESCE($5,roi_percentage),duration_days=COALESCE($6,duration_days),
       is_active=COALESCE($7,is_active),pool_target_amount=COALESCE($8,pool_target_amount),updated_at=NOW() WHERE id=$9`,
      [name,description,min_amount,max_amount,roi_percentage,duration_days,is_active,pool_target_amount,req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/plans/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM investment_plans WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// INVEST — supports plan, slot, or lot level with pending → admin approval flow
router.post('/invest', authenticate, async (req: AuthRequest, res) => {
  const { plan_id, amount, level, slot_id, lot_id } = req.body;
  const userId = req.user.id;

  try {
    let planRes: any, roi: number, days: number, planName: string;
    const invLevel = level || 'plan';

    if (invLevel === 'plan') {
      planRes = await pool.query('SELECT * FROM investment_plans WHERE id=$1 AND is_active=TRUE', [plan_id]);
      if (planRes.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
      roi = parseFloat(planRes.rows[0].roi_percentage);
      days = planRes.rows[0].duration_days;
      planName = planRes.rows[0].name;
    } else if (invLevel === 'slot') {
      planRes = await pool.query('SELECT s.*, p.name as plan_name FROM slots s JOIN investment_plans p ON s.plan_id=p.id WHERE s.id=$1 AND s.is_active=TRUE', [slot_id]);
      if (planRes.rows.length === 0) return res.status(404).json({ error: 'Slot not found' });
      roi = parseFloat(planRes.rows[0].roi_percentage);
      days = planRes.rows[0].duration_days;
      planName = planRes.rows[0].plan_name;
    } else if (invLevel === 'lot') {
      planRes = await pool.query('SELECT l.*, s.roi_percentage as slot_roi, s.duration_days as slot_days, s.name as slot_name, p.name as plan_name FROM lots l JOIN slots s ON l.slot_id=s.id JOIN investment_plans p ON s.plan_id=p.id WHERE l.id=$1 AND l.is_active=TRUE', [lot_id]);
      if (planRes.rows.length === 0) return res.status(404).json({ error: 'Lot not found' });
      roi = parseFloat(planRes.rows[0].roi_percentage) || parseFloat(planRes.rows[0].slot_roi);
      days = planRes.rows[0].duration_days || planRes.rows[0].slot_days;
      planName = planRes.rows[0].plan_name;
      // Increment lot persons
      await pool.query('UPDATE lots SET current_persons=current_persons+1 WHERE id=$1', [lot_id]);
    } else {
      return res.status(400).json({ error: 'Invalid invest level' });
    }

    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    const userRes = await pool.query('SELECT balance FROM users WHERE id=$1', [userId]);
    if (parseFloat(userRes.rows[0].balance) < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const totalProfit = (amount * roi) / 100;
    const dailyProfit = totalProfit / days;
    const endDate = new Date(Date.now() + days * 86400000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET balance=balance-$1, total_invested=total_invested+$1, updated_at=NOW() WHERE id=$2', [amount, userId]);
      // Check if this pool has a target — if so, go to 'pooled' status
      const poolTarget = invLevel==='plan' ? parseFloat(planRes.rows[0]?.pool_target_amount||'0') :
        invLevel==='slot' ? parseFloat(planRes.rows[0]?.pool_target_amount||'0') :
        parseFloat(planRes.rows[0]?.pool_target_amount||'0');
      const hasPool = poolTarget > 0;
      const initialStatus = hasPool ? 'pooled' : 'active';
      const startForEnd = hasPool ? new Date(Date.now() + days * 86400000) : endDate;

      const invRes2 = await client.query(
        `INSERT INTO investments (user_id,plan_id,slot_id,lot_id,invest_level,amount,end_date,daily_profit,total_profit,status,last_profit_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL) RETURNING id`,
        [userId, invLevel==='plan'?plan_id:null, invLevel==='slot'||invLevel==='lot'?slot_id:null,
         invLevel==='lot'?lot_id:null, invLevel, amount, startForEnd, dailyProfit, totalProfit, initialStatus]);

      // Update pool current amount
      if (hasPool) {
        if (invLevel==='plan') await client.query('UPDATE investment_plans SET current_pooled_amount=current_pooled_amount+$1, pool_status=$2 WHERE id=$3', [amount, 'filling', plan_id]);
        else if (invLevel==='slot') await client.query('UPDATE slots SET current_pooled_amount=current_pooled_amount+$1, pool_status=$2 WHERE id=$3', [amount, 'filling', slot_id]);
        else if (invLevel==='lot') await client.query('UPDATE lots SET current_pooled_amount=current_pooled_amount+$1, pool_status=$2 WHERE id=$3', [amount, 'filling', lot_id]);
      }

      await client.query("INSERT INTO transactions (user_id,type,amount,status,notes) VALUES ($1,'investment',$2,'approved',$3)",
        [userId, amount, hasPool ? `${planName} (${invLevel}) — pooled, awaiting pool activation` : `Invested in ${planName} (${invLevel})`]);

      // Referral commissions
      const userDataRes = await client.query('SELECT * FROM users WHERE id=$1', [userId]);
      const userData = userDataRes.rows[0];
      if (userData.referred_by) {
        const t1 = await client.query('SELECT id FROM users WHERE referral_code=$1', [userData.referred_by]);
        if (t1.rows.length > 0) {
          const c1 = (amount * 7) / 100;
          await client.query('UPDATE users SET balance=balance+$1, referral_earnings=referral_earnings+$1 WHERE id=$2', [c1, t1.rows[0].id]);
          await client.query("INSERT INTO transactions (user_id,type,amount,status,notes) VALUES ($1,'referral',$2,'approved',$3)", [t1.rows[0].id, c1, `Tier 1 from ${userData.name}`]);
          await client.query('INSERT INTO referral_earnings (referrer_id,referred_user_id,investment_id,tier,commission_percentage,amount) VALUES ($1,$2,$3,1,7,$4)', [t1.rows[0].id, userId, invRes2.rows[0].id, c1]);
        }
      }

      await client.query('COMMIT');
      await logActivity(userId, 'INVEST', `${hasPool?'Pooled':'Active'} $${amount} in ${planName} (${invLevel})`, req);
      res.json({ success: true, message: hasPool ? 'Investment pooled! Will activate when pool fills.' : 'Investment activated!' });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message || 'Failed' }); }
});

// APPROVE / REJECT investment
router.put('/investments/:id/review', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;
  if (!status || !['active','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query('SELECT * FROM investments WHERE id=$1', [id]);
    if (invRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const inv = invRes.rows[0];
    if (inv.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Not pending' }); }

    await client.query('UPDATE investments SET status=$1, admin_notes=$2, updated_at=NOW() WHERE id=$3', [status, admin_notes||null, id]);

    if (status === 'cancelled') {
      // Decrement lot persons if applicable
      if (inv.lot_id) await client.query('UPDATE lots SET current_persons=GREATEST(0,current_persons-1) WHERE id=$1', [inv.lot_id]);
      // Refund
      await client.query('UPDATE users SET balance=balance+$1, total_invested=GREATEST(0,total_invested-$1), updated_at=NOW() WHERE id=$2', [parseFloat(inv.amount), inv.user_id]);
      await client.query("INSERT INTO transactions (user_id,type,amount,status,notes) VALUES ($1,'profit',$2,'approved','Investment rejected — refunded')", [inv.user_id, parseFloat(inv.amount)]);
    } else {
      // Approved — referral commissions
      const userRes = await client.query('SELECT * FROM users WHERE id=$1', [inv.user_id]);
      const user = userRes.rows[0];
      if (user.referred_by) {
        const t1 = await client.query('SELECT id FROM users WHERE referral_code=$1', [user.referred_by]);
        if (t1.rows.length > 0) {
          const amt = parseFloat(inv.amount);
          const c1 = (amt * 7) / 100;
          await client.query('UPDATE users SET balance=balance+$1, referral_earnings=referral_earnings+$1 WHERE id=$2', [c1, t1.rows[0].id]);
          await client.query("INSERT INTO transactions (user_id,type,amount,status,notes) VALUES ($1,'referral',$2,'approved',$3)", [t1.rows[0].id, c1, `Tier 1 from ${user.name}`]);
          await client.query('INSERT INTO referral_earnings (referrer_id,referred_user_id,investment_id,tier,commission_percentage,amount) VALUES ($1,$2,$3,1,7,$4)', [t1.rows[0].id, inv.user_id, id, c1]);
        }
      }
    }
    await client.query('COMMIT');
    await logActivity(req.user.id, 'INVEST_REVIEW', `Admin ${status} investment ${id}`, req);
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ error: 'Failed' }); }
  finally { client.release(); }
});

// MY INVESTMENTS
router.get('/my-investments', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name as plan_name, s.name as slot_name, l.name as lot_name
      FROM investments i
      LEFT JOIN investment_plans p ON i.plan_id = p.id
      LEFT JOIN slots s ON i.slot_id = s.id
      LEFT JOIN lots l ON i.lot_id = l.id
      WHERE i.user_id = $1 ORDER BY i.created_at DESC`, [req.user.id]);
    res.json(result.rows.map(r => ({
      id: r.id, userId: r.user_id, planId: r.plan_id, slotId: r.slot_id, lotId: r.lot_id,
      investLevel: r.invest_level,
      amount: parseFloat(r.amount), startDate: r.start_date, endDate: r.end_date,
      dailyProfit: parseFloat(r.daily_profit), totalProfit: parseFloat(r.total_profit),
      earnedProfit: parseFloat(r.earned_profit), status: r.status,
      cancelRequested: r.cancel_requested, adminNotes: r.admin_notes,
      productName: r.plan_name || r.slot_name || r.lot_name,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ALL INVESTMENTS (admin)
router.get('/all-investments', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name as plan_name, s.name as slot_name, l.name as lot_name,
        u.name as user_name, u.email as user_email
      FROM investments i
      LEFT JOIN investment_plans p ON i.plan_id = p.id
      LEFT JOIN slots s ON i.slot_id = s.id
      LEFT JOIN lots l ON i.lot_id = l.id
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC`);
    res.json(result.rows.map(r => ({
      id: r.id, userId: r.user_id, planId: r.plan_id, slotId: r.slot_id, lotId: r.lot_id,
      investLevel: r.invest_level,
      amount: parseFloat(r.amount), startDate: r.start_date, endDate: r.end_date,
      dailyProfit: parseFloat(r.daily_profit), totalProfit: parseFloat(r.total_profit),
      earnedProfit: parseFloat(r.earned_profit), status: r.status,
      cancelRequested: r.cancel_requested, adminNotes: r.admin_notes,
      productName: r.plan_name || r.slot_name || r.lot_name,
      userName: r.user_name, userEmail: r.user_email,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
