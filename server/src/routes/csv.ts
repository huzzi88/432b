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

  // Whitelist allowed column names per table to prevent SQL injection
  const ALLOWED_COLUMNS: Record<string, string[]> = {
    users: ['name', 'email', 'phone', 'address', 'city', 'country', 'balance'],
    investment_plans: ['name', 'description', 'min_amount', 'max_amount', 'roi_percentage', 'duration_days', 'is_active'],
    investments: ['user_id', 'plan_id', 'amount', 'status'],
    transactions: ['user_id', 'type', 'amount', 'payment_method', 'status'],
    payment_gateways: ['name', 'type', 'account_details', 'is_active'],
    kyc_documents: ['user_id', 'cnic_number', 'status'],
    notifications: ['title', 'message', 'is_active'],
    tasks: ['assigned_to', 'title', 'description', 'reward_amount', 'status'],
    referral_earnings: ['referrer_id', 'referred_user_id', 'tier', 'commission_percentage', 'amount'],
    activity_logs: ['user_id', 'action', 'description'],
    profit_distribution_logs: ['investment_id', 'user_id', 'amount'],
    competitions: ['title', 'description', 'type', 'prize_amount', 'is_active'],
    competition_entries: ['competition_id', 'user_id'],
  };

  try {
    let imported = 0;
    const allowedCols = ALLOWED_COLUMNS[table] || [];
    
    for (const row of csvData) {
      // Filter to only allowed columns - prevent SQL injection via column names
      const keys = Object.keys(row).filter(k => k !== 'id' && allowedCols.includes(k));
      if (keys.length === 0) continue; // Skip rows with no valid columns
      
      // Validate that all values are safe (no SQL injection in values)
      const vals = keys.map(k => {
        const val = row[k];
        // Reject any value containing suspicious SQL patterns
        if (typeof val === 'string' && /(--|;|\/\*|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/i.test(val)) {
          throw new Error(`Invalid value in column ${k}`);
        }
        return val;
      });
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, vals);
      imported++;
    }
    res.json({ success: true, imported });
  } catch (err: any) { 
    console.error('CSV import error:', err); 
    res.status(500).json({ error: `Import failed: ${err.message}` }); 
  }
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
