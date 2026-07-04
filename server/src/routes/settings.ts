// ═══════════════════════════════════════════════
// SITE SETTINGS — Logo, favicon, site name
// Admin-only write, public read
// ═══════════════════════════════════════════════
import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all settings (public)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// SET a setting (admin)
router.put('/:key', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'value required' });
  try {
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
