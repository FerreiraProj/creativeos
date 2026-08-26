import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db.ts';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ pool, createTableIfMissing: true, tableName: 'user_sessions' }),
  secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
});

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    return next();
  }
  res.status(401).json({ success: false, error: 'Not authenticated' });
}

// Single-user password check: prefers a bcrypt hash (APP_PASSWORD_HASH); falls back to a
// plain-text comparison (APP_PASSWORD) for local/dev convenience only.
export async function verifyPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const hash = process.env.APP_PASSWORD_HASH;
  if (hash) {
    return bcrypt.compare(input, hash);
  }
  const plain = process.env.APP_PASSWORD;
  if (plain) {
    return input === plain;
  }
  return false;
}
