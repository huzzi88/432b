import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

const TABLES = ['users','investment_plans','investments','transactions','payment_gateways','kyc_documents','notifications','tasks','referral_earnings','activity_logs','profit_distribution_logs','competitions','competition_entries'];

// EXPORT table as JSON (admin downloads and converts to CSV on frontend)
router.get('/export/:table', authenticate, adminOnly, async (req, res) => {
  const { table } = req.params;
  if (!TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    // Hide password hashes from users export
    const rows = table === 'users' ? result.rows.map(r => ({ ...r, password: '***', login_pin: '***', admin_pin1: '***', admin_pin2: '***', admin_pin3: '***' })) : result.rows;
    res.json({ table, rows, count: rows.length });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Export failed' }); }
});

// IMPORT CSV data into table (admin)
router.post('/import/:table', authenticate, adminOnly, async (req, res) => {
  const { table } = req.params;
  const { csvData } = req.body;
  if (!TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' });
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) return res.status(400).json({ error: 'No data' });

  try {
    let imported = 0;
    for (const row of csvData) {
      const keys = Object.keys(row).filter(k => k !== 'id');
      const vals = keys.map(k => row[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, vals);
      imported++;
    }
    res.json({ success: true, imported });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Import failed' }); }
});

// GET all table names with counts (admin)
router.get('/tables', authenticate, adminOnly, async (_req, res) => {
  try {
    const counts: Record<string, number> = {};
    for (const t of TABLES) {
      const r = await pool.query(`SELECT COUNT(*) as c FROM ${t}`);
      counts[t] = parseInt(r.rows[0].c);
    }
    res.json(counts);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
