import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all competitions
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// CREATE competition (admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { title, description, type, target_referrals, target_deposit_amount, target_invest_amount, prize_description, prize_amount, end_date } = req.body;
  try {
    await pool.query(
      `INSERT INTO competitions (title,description,type,target_referrals,target_deposit_amount,target_invest_amount,prize_description,prize_amount,end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [title, description, type||'referral', target_referrals||0, target_deposit_amount||0, target_invest_amount||0, prize_description, prize_amount||0, end_date]
    );
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// UPDATE competition (admin)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { is_active, title, description } = req.body;
  try {
    await pool.query('UPDATE competitions SET is_active=COALESCE($1,is_active), title=COALESCE($2,title), description=COALESCE($3,description) WHERE id=$4', [is_active, title, description, id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// DELETE competition (admin)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM competitions WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// JOIN competition (user)
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'INSERT INTO competition_entries (competition_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET my competition entries (user)
router.get('/my-entries', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT ce.*, c.title, c.type, c.target_referrals, c.target_deposit_amount, c.target_invest_amount, c.prize_description, c.prize_amount, c.end_date
       FROM competition_entries ce JOIN competitions c ON ce.competition_id=c.id WHERE ce.user_id=$1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET all entries (admin)
router.get('/all-entries', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ce.*, c.title as comp_title, u.name as user_name, u.email as user_email
       FROM competition_entries ce JOIN competitions c ON ce.competition_id=c.id JOIN users u ON ce.user_id=u.id ORDER BY ce.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
