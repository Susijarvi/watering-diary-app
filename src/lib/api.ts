import type { ClientPrincipal, DiaryEntry } from './types';

export async function fetchAuth(): Promise<ClientPrincipal> {
  const res = await fetch('/.auth/me');
  if (!res.ok) return { clientPrincipal: null };
  return res.json();
}

export async function fetchEntries(): Promise<DiaryEntry[]> {
  const res = await fetch('/api/entries');
  if (!res.ok) throw new Error(`Haku epäonnistui: ${res.status}`);
  return res.json();
}

export async function saveEntry(entry: DiaryEntry): Promise<DiaryEntry> {
  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Tallennus epäonnistui: ${res.status}`);
  return res.json();
}

export function exportCsvUrl(): string {
  return '/api/export';
}

export function loginUrl(): string {
  return '/.auth/login/google?post_login_redirect_uri=/';
}

export function logoutUrl(): string {
  return '/.auth/logout?post_logout_redirect_uri=/';
}
