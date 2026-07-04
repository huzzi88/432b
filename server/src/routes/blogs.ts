import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// ─── CATEGORIES ──────────────────────────────────
router.get('/categories', async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM blog_categories ORDER BY name'); res.json(r.rows); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/categories', authenticate, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try { await pool.query('INSERT INTO blog_categories (name) VALUES ($1)', [name]); res.status(201).json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/categories/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('UPDATE blog_categories SET name=COALESCE($1,name) WHERE id=$2', [req.body.name, req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/categories/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM blog_categories WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// ─── POSTS ───────────────────────────────────────
router.get('/posts', async (req, res) => {
  const category_id = req.query.category_id ? String(req.query.category_id) : undefined;
  let sql = `SELECT bp.*, bc.name as category_name FROM blog_posts bp LEFT JOIN blog_categories bc ON bp.category_id=bc.id`;
  const vals: any[] = [];
  if (category_id) { sql += ' WHERE bp.category_id=$1'; vals.push(category_id); }
  sql += ' ORDER BY bp.created_at DESC';
  try { const r = await pool.query(sql, vals); res.json(r.rows); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/posts', authenticate, adminOnly, async (req, res) => {
  const { category_id, title, content, image } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  try {
    await pool.query('INSERT INTO blog_posts (category_id,title,content,image) VALUES ($1,$2,$3,$4)', [category_id, title, content, image||null]);
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/posts/:id', authenticate, adminOnly, async (req, res) => {
  const { title, content, image, category_id, is_published } = req.body;
  try {
    await pool.query(`UPDATE blog_posts SET title=COALESCE($1,title),content=COALESCE($2,content),image=COALESCE($3,image),
      category_id=COALESCE($4,category_id),is_published=COALESCE($5,is_published),updated_at=NOW() WHERE id=$6`,
      [title,content,image,category_id,is_published,req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.delete('/posts/:id', authenticate, adminOnly, async (req, res) => {
  try { await pool.query('DELETE FROM blog_posts WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
