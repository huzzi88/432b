// ═══════════════════════════════════════════════
// DAILY ROI RATES — Admin sets daily ROI %
// Applies to ALL active investments
// ═══════════════════════════════════════════════
import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// GET today's ROI rate (or latest available)
router.get('/current', async (req, res) => {
  try {
    // Try today's rate first
    const todayRes = await pool.query('SELECT * FROM daily_roi_rates WHERE rate_date = CURRENT_DATE');
    if (todayRes.rows.length > 0) {
      return res.json(todayRes.rows[0]);
    }
    // Fall back to most recent rate
    const latestRes = await pool.query('SELECT * FROM daily_roi_rates ORDER BY rate_date DESC LIMIT 1');
    if (latestRes.rows.length > 0) {
      return res.json({ ...latestRes.rows[0], note: `Rate from ${latestRes.rows[0].rate_date} (no rate set for today)` });
    }
    res.json({ roi_percentage: 0, note: 'No ROI rate has been set yet' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET all ROI rate history (admin)
router.get('/history', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_roi_rates ORDER BY rate_date DESC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// SET today's ROI rate (admin only)
router.post('/today', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { roi_percentage, note } = req.body;
  if (roi_percentage === undefined || roi_percentage === null) return res.status(400).json({ error: 'roi_percentage required' });

  try {
    const result = await pool.query(
      `INSERT INTO daily_roi_rates (rate_date, roi_percentage, note, created_by)
       VALUES (CURRENT_DATE, $1, $2, $3)
       ON CONFLICT (rate_date) DO UPDATE SET roi_percentage = EXCLUDED.roi_percentage, note = EXCLUDED.note
       RETURNING *`,
      [parseFloat(roi_percentage), note || null, req.user.id]
    );
    await logActivity(req.user.id, 'ROI_RATE_SET', `Admin set daily ROI to ${roi_percentage}%`, req);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to set ROI rate' });
  }
});

// UPDATE a specific date's ROI rate (admin)
router.put('/:date', authenticate, adminOnly, async (req: AuthRequest, res) => {
  const { roi_percentage, note } = req.body;
  const { date } = req.params;
  if (roi_percentage === undefined) return res.status(400).json({ error: 'roi_percentage required' });

  try {
    const result = await pool.query(
      `UPDATE daily_roi_rates SET roi_percentage = $1, note = COALESCE($2, note)
       WHERE rate_date = $3 RETURNING *`,
      [parseFloat(roi_percentage), note, date]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rate not found for this date' });
    await logActivity(req.user.id, 'ROI_RATE_UPDATED', `Admin updated ROI for ${date} to ${roi_percentage}%`, req);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
