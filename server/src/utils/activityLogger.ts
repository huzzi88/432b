import pool from '../database/db';
import { Request } from 'express';

export const logActivity = async (
  userId: string | null,
  action: string,
  description: string,
  req?: Request,
  metadata?: Record<string, any>
) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '') : '';
    const ua = req ? (req.headers['user-agent'] || '') : '';

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent, metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, action, description, ip, ua, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    console.error('Activity log error:', err);
  }
};
