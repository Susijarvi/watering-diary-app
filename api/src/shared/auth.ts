import type { HttpRequest } from '@azure/functions';
import { verifySession } from './jwt';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const raw of cookieHeader.split(';')) {
    const [k, ...v] = raw.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export async function getUser(req: HttpRequest): Promise<AuthUser | null> {
  const token = parseCookie(req.headers.get('cookie'), SESSION_COOKIE);
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  return {
    userId: session.sub,
    email: session.email,
    role: session.role,
  };
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function emailToRole(email: string): 'admin' | 'user' | null {
  const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const childEmail = (process.env.CHILD_EMAIL ?? '').toLowerCase().trim();
  const e = email.toLowerCase().trim();
  if (adminEmail && e === adminEmail) return 'admin';
  if (childEmail && e === childEmail) return 'user';
  return null;
}

export function buildSessionCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function clearSessionCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; ');
}
