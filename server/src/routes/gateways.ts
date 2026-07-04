import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payment_gateways ORDER BY created_at');
    const gw = result.rows.map(r => ({
      id: r.id, name: r.name, type: r.type, accountDetails: r.account_details,
      walletAddress: r.wallet_address, chain: r.chain, image: r.image,
      isActive: r.is_active, icon: r.icon,
    }));
    res.json(gw);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, type, accountDetails, account_details, icon, walletAddress, wallet_address, chain, image } = req.body;
  try {
    await pool.query('INSERT INTO payment_gateways (name, type, account_details, icon, wallet_address, chain, image) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [name, type || 'bank', accountDetails || account_details, icon || '💳', walletAddress || wallet_address || null, chain || null, image || null]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, type, accountDetails, account_details, icon, isActive, is_active, walletAddress, wallet_address, chain } = req.body;
  try {
    await pool.query(
      'UPDATE payment_gateways SET name=COALESCE($1,name), type=COALESCE($2,type), account_details=COALESCE($3,account_details), icon=COALESCE($4,icon), is_active=COALESCE($5,is_active), wallet_address=COALESCE($6,wallet_address), chain=COALESCE($7,chain) WHERE id=$8',
      [name, type, accountDetails || account_details, icon, isActive ?? is_active, walletAddress || wallet_address, chain, id]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM payment_gateways WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
