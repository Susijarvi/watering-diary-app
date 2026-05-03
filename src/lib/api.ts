import type { AuthMeResponse, AuthUser, DiaryEntry } from './types';

export async function fetchAuth(): Promise<AuthMeResponse> {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!res.ok) return { user: null, googleClientId: null };
  return res.json();
}

export async function loginWithGoogleCredential(credential: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    let msg = 'Kirjautuminen epäonnistui';
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.user as AuthUser;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}

export async function fetchEntries(): Promise<DiaryEntry[]> {
  const res = await fetch('/api/entries', { credentials: 'same-origin' });
  if (res.status === 401) throw new Error('UNAUTHENTICATED');
  if (!res.ok) throw new Error(`Haku epäonnistui: ${res.status}`);
  return res.json();
}

export async function saveEntry(entry: DiaryEntry): Promise<DiaryEntry> {
  const res = await fetch('/api/entries', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Tallennus epäonnistui: ${res.status}`);
  return res.json();
}

export function exportCsvUrl(): string {
  return '/api/export';
}
