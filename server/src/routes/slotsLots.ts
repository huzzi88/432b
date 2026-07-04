import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// ─── SLOTS ───────────────────────────────────────
router.get('/slots', async (req, res) => {
  const plan_id = req.query.plan_id ? String(req.query.plan_id) : undefined;
  let sql = 'SELECT s.*, p.name as plan_name FROM slots s LEFT JOIN investment_plans p ON s.plan_id=p.id';
  const vals: any[] = [];
  if (plan_id) { sql += ' WHERE s.plan_id=$1'; vals.push(plan_id); }
  sql += ' ORDER BY s.created_at DESC';
  try { const r = await pool.query(sql, vals); res.json(r.rows); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/slots', authenticate, adminOnly, async (req, res) => {
  const { plan_id, name, description, roi_percentage, duration_days, min_amount, max_amount, pool_target_amount } = req.body;
  if (!plan_id || !name) return res.status(400).json({ error: 'plan_id and name required' });
  try {
    await pool.query('INSERT INTO slots (plan_id,name,description,roi_percentage,duration_days,min_amount,max_amount,pool_target_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [plan_id, name, description||'', roi_percentage||0, duration_days||30, min_amount||0, max_amount||0, pool_target_amount||0]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/slots/:id', authenticate, adminOnly, async (req, res) => {
  const { name, description, roi_percentage, duration_days, min_amount, max_amount, is_active, pool_target_amount } = req.body;
  try {
    await pool.query(`UPDATE slots SET name=COALESCE($1,name),description=COALESCE($2,description),roi_percentage=COALESCE($3,roi_percentage),
      duration_days=COALESCE($4,duration_days),min_amount=COALESCE($5,min_amount),max_amount=COALESCE($6,max_amount),
      is_active=COALESCE($7,is_active),pool_target_amount=COALESCE($8,pool_target_amount),updated_at=NOW() WHERE id=$9`,
      [name,description,roi_percentage,duration_days,min_amount,max_amount,is_active,pool_target_amount,req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/slots/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM slots WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ─── LOTS ────────────────────────────────────────
router.get('/lots', async (req, res) => {
  const slot_id = req.query.slot_id ? String(req.query.slot_id) : undefined;
  let sql = 'SELECT l.*, s.name as slot_name FROM lots l LEFT JOIN slots s ON l.slot_id=s.id';
  const vals: any[] = [];
  if (slot_id) { sql += ' WHERE l.slot_id=$1'; vals.push(slot_id); }
  sql += ' ORDER BY l.created_at DESC';
  try { const r = await pool.query(sql, vals); res.json(r.rows); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/lots', authenticate, adminOnly, async (req, res) => {
  const { slot_id, name, description, roi_percentage, duration_days, lot_size, max_persons, pool_target_amount } = req.body;
  if (!slot_id || !name) return res.status(400).json({ error: 'slot_id and name required' });
  try {
    await pool.query('INSERT INTO lots (slot_id,name,description,roi_percentage,duration_days,lot_size,max_persons,pool_target_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [slot_id, name, description||'', roi_percentage||0, duration_days||30, lot_size||0, max_persons||10, pool_target_amount||0]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/lots/:id', authenticate, adminOnly, async (req, res) => {
  const { name, description, roi_percentage, duration_days, lot_size, max_persons, is_active, pool_target_amount } = req.body;
  try {
    await pool.query(`UPDATE lots SET name=COALESCE($1,name),description=COALESCE($2,description),roi_percentage=COALESCE($3,roi_percentage),
      duration_days=COALESCE($4,duration_days),lot_size=COALESCE($5,lot_size),max_persons=COALESCE($6,max_persons),
      is_active=COALESCE($7,is_active),pool_target_amount=COALESCE($8,pool_target_amount),updated_at=NOW() WHERE id=$9`,
      [name,description,roi_percentage,duration_days,lot_size,max_persons,is_active,pool_target_amount,req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/lots/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM lots WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
