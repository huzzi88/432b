import { Router } from 'express';
import pool from '../database/db';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/tasks — Create task (admin)
router.post('/tasks', authenticate, adminOnly, async (req, res) => {
  const { title, description, reward_amount, assigned_to } = req.body;
  if (!title || !description || !reward_amount) return res.status(400).json({ error: 'title, description, reward required' });

  try {
    if (assigned_to) {
      await pool.query(
        'INSERT INTO tasks (assigned_to, title, description, reward_amount) VALUES ($1,$2,$3,$4)',
        [assigned_to, title, description, reward_amount]
      );
    } else {
      const users = await pool.query('SELECT id FROM users WHERE is_admin = FALSE AND is_blocked = FALSE');
      for (const u of users.rows) {
        await pool.query(
          'INSERT INTO tasks (assigned_to, title, description, reward_amount) VALUES ($1,$2,$3,$4)',
          [u.id, title, description, reward_amount]
        );
      }
    }
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create task' }); }
});

// GET /api/my-tasks — My tasks (user)
router.get('/my-tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC', [req.user.id]);
    const tasks = result.rows.map(r => ({
      id: r.id, assignedTo: r.assigned_to, title: r.title, description: r.description,
      rewardAmount: parseFloat(r.reward_amount), screenshotUrl: r.screenshot_url,
      status: r.status, rejectionReason: r.rejection_reason,
      submittedAt: r.submitted_at, reviewedAt: r.reviewed_at, createdAt: r.created_at,
    }));
    res.json(tasks);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// GET /api/all-tasks — All tasks (admin)
router.get('/all-tasks', authenticate, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as user_name, u.email as user_email FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id ORDER BY t.created_at DESC
    `);
    const tasks = result.rows.map(r => ({
      id: r.id, assignedTo: r.assigned_to, title: r.title, description: r.description,
      rewardAmount: parseFloat(r.reward_amount), screenshotUrl: r.screenshot_url,
      status: r.status, rejectionReason: r.rejection_reason,
      submittedAt: r.submitted_at, reviewedAt: r.reviewed_at, createdAt: r.created_at,
      userName: r.user_name, userEmail: r.user_email,
    }));
    res.json(tasks);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/tasks/:id/submit — Submit task proof (user)
router.put('/tasks/:id/submit', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { screenshot_url } = req.body;

  try {
    const result = await pool.query(
      "UPDATE tasks SET screenshot_url = $1, status = 'submitted', submitted_at = NOW() WHERE id = $2 AND assigned_to = $3 RETURNING id",
      [screenshot_url, id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found or not yours' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/tasks/:id/review — Review task (admin)
router.put('/tasks/:id/review', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Task not found' }); }

    const task = taskRes.rows[0];

    if (task.status !== 'submitted') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Task not in submitted state' }); }

    await client.query(
      "UPDATE tasks SET status = $1, rejection_reason = $2, reviewed_at = NOW() WHERE id = $3",
      [status, rejection_reason || null, id]
    );

    if (status === 'approved') {
      const reward = parseFloat(task.reward_amount);
      await client.query('UPDATE users SET balance = balance + $1, total_earnings = total_earnings + $1, updated_at = NOW() WHERE id = $2', [reward, task.assigned_to]);
      await client.query(
        "INSERT INTO transactions (user_id, type, amount, status, notes) VALUES ($1, 'profit', $2, 'approved', $3)",
        [task.assigned_to, reward, `Task reward: ${task.title}`]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  } finally {
    client.release();
  }
});

export default router;
