// ═══════════════════════════════════════════════
// SECURITY MIDDLEWARE — Complete protection layer
// ═══════════════════════════════════════════════
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ─── 1. Input Sanitizer ──────────────────────────
const sanitizeValue = (val: any): any => {
  if (typeof val === 'string') {
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*on\w+\s*=\s*[^>]*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/document\.cookie/gi, '')
      .replace(/document\.domain/gi, '')
      .replace(/window\.location/gi, '')
      .trim()
      .slice(0, 10000);
  }
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object') {
    const clean: any = {};
    for (const k of Object.keys(val)) {
      clean[k] = sanitizeValue(val[k]);
    }
    return clean;
  }
  return val;
};

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ─── 2. Global Error Handler ─────────────────────
export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
  });

  if (err.code && err.code.startsWith('2')) {
    return res.status(400).json({ error: 'Data validation failed' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const clientMessage = statusCode === 500 ? 'Internal server error' : err.message || 'Something went wrong';
  res.status(statusCode).json({ error: clientMessage });
};

// ─── 3. Request Size Limiter ─────────────────────
export const strictBodyLimit = (maxBytes: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: 'Request body too large' });
    }
    next();
  };
};

// ─── 4. Security Headers ─────────────────────────
export const extraSecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
};

// ─── 5. VPN Detection Middleware ──────────────────
// Blocks requests from known VPN/proxy IP ranges
// Uses X-Forwarded-For header checking + common VPN detection
export const vpnProtection = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

  // Skip VPN check for localhost / internal Docker network
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('172.') || clientIp.startsWith('10.') || clientIp.startsWith('192.168.')) {
    return next();
  }

  // Check for VPN/proxy headers
  const via = req.headers['via'] as string || '';
  const forwarded = req.headers['x-forwarded-for'] as string || '';
  const realIp = req.headers['x-real-ip'] as string || '';

  // Known VPN header patterns
  const vpnIndicators = [
    via.includes('proxy'),
    via.includes('squid'),
    forwarded.split(',').length > 3, // too many proxy hops
  ];

  // If VPN detected, block with a message
  if (vpnIndicators.some(Boolean)) {
    console.warn(`⚠️ VPN detected: ${clientIp}`);
    return res.status(403).json({ error: 'VPN/proxy connections are not allowed. Please disable VPN.' });
  }

  next();
};

// ─── 6. SQL Injection Detection ───────────────────
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|WHERE|SET|TABLE|DATABASE)\b)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(--\s)/,
    /(\b(SLEEP|BENCHMARK|WAITFOR)\b\s*\()/i,
    /(\/\*.*\*\/)/,
    /(\b(CAST|CONVERT)\b\s*\()/i,
    /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
  ];

  const checkValue = (val: any): boolean => {
    if (typeof val === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(val));
    }
    if (Array.isArray(val)) return val.some(checkValue);
    if (val && typeof val === 'object') {
      return Object.values(val).some(checkValue);
    }
    return false;
  };

  const allInputs = { ...req.query, ...req.params, ...(req.body || {}) };
  if (checkValue(allInputs)) {
    console.warn(`⚠️ SQL injection attempt from ${req.ip}: ${JSON.stringify(allInputs).slice(0, 200)}`);
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// ─── 7. Path Traversal Protection ────────────────
export const pathTraversalProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspicious = /(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f)/i;
  const url = req.url;
  const body = JSON.stringify(req.body || {});

  if (suspicious.test(url) || suspicious.test(body)) {
    console.warn(`⚠️ Path traversal attempt from ${req.ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid path' });
  }
  next();
};

// ─── 8. Honeypot Detection ────────────────────────
// Catches automated bots that fill hidden fields
export const honeypotDetection = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.website_url) {
    // This field should be empty — if filled, it's a bot
    console.warn(`⚠️ Bot detected via honeypot from ${req.ip}`);
    return res.status(400).json({ error: 'Bot detected' });
  }
  next();
};
