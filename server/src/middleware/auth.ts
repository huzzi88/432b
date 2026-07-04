// ═══════════════════════════════════════════════════════
// AUTH MIDDLEWARE — httpOnly cookie-based JWT
// Token stored in httpOnly, secure, sameSite cookie
// NEVER exposed to JavaScript (XSS-proof)
// ═══════════════════════════════════════════════════════
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../database/db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_32_CHAR_MIN';
const IS_PROD = process.env.NODE_ENV === 'production';

// Parse expiry string ("7d","24h") to seconds
const JWT_EXPIRY_SECONDS: number = (() => {
  const val = process.env.JWT_EXPIRES_IN || '7d';
  const match = val.match(/^(\d+)(s|m|h|d)$/);
  if (match) {
    const n = parseInt(match[1]);
    switch (match[2]) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
    }
  }
  return 604800; // 7 days default
})();

// Cookie configuration — httpOnly prevents XSS token theft
const COOKIE_OPTIONS = {
  httpOnly: true,          // ← JavaScript CANNOT access this cookie
  secure: IS_PROD,         // ← HTTPS only in production
  sameSite: 'strict' as const, // ← blocks CSRF cross-origin sends
  maxAge: JWT_EXPIRY_SECONDS * 1000,
  path: '/',
};

export interface AuthRequest extends Request {
  user?: any;
}

// ─── Set JWT as httpOnly cookie ──────────────────
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('auth_token', token, COOKIE_OPTIONS);
};

// ─── Clear auth cookie (logout) ──────────────────
export const clearAuthCookie = (res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
};

// ─── Generate JWT ────────────────────────────────
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY_SECONDS }
  );
};

// ─── Authenticate from httpOnly cookie ───────────
// Reads token from cookie (not Authorization header)
// Falls back to Bearer header for backward compat during migration
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Try httpOnly cookie first (secure path)
  let token = req.cookies?.auth_token;

  // 2. Fallback to Bearer header (for migration / API clients)
  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Only select needed fields — never SELECT * in auth
    const result = await pool.query(
      'SELECT id, name, email, is_admin, is_blocked FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.is_blocked) {
      clearAuthCookie(res);
      return res.status(403).json({ error: 'Account blocked' });
    }

    // Attach minimal user info (load full profile only when needed)
    req.user = user;
    next();
  } catch (err: any) {
    // Differentiate expired vs invalid tokens
    if (err.name === 'TokenExpiredError') {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Admin-only middleware ────────────────────────
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
