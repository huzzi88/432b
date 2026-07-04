import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY date DESC');
    const notifs = result.rows.map(r => ({
      id: r.id, title: r.title, message: r.message, isActive: r.is_active, date: r.date,
    }));
    res.json(notifs);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  try {
    await pool.query('INSERT INTO notifications (title, message) VALUES ($1, $2)', [title, message]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, message, isActive, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE notifications SET title=COALESCE($1,title), message=COALESCE($2,message), is_active=COALESCE($3,is_active) WHERE id=$4',
      [title, message, isActive ?? is_active, id]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
