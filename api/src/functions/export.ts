import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { getClientPrincipal, isAdmin } from '../shared/auth';
import { ensureTable, listAllEntries } from '../shared/storage';

function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportCsv(req: HttpRequest): Promise<HttpResponseInit> {
  const principal = getClientPrincipal(req);
  if (!principal) {
    return { status: 401, body: 'Not authenticated' };
  }
  if (!isAdmin(principal)) {
    return { status: 403, body: 'Forbidden' };
  }

  await ensureTable();
  const rows = await listAllEntries();
  rows.sort((a, b) => {
    const c = a.rowKey.localeCompare(b.rowKey);
    return c !== 0 ? c : (a.userEmail ?? '').localeCompare(b.userEmail ?? '');
  });

  const header = ['date', 'userEmail', 'hadDiaper', 'diaperWet', 'bedWet', 'updatedAt'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.rowKey),
        csvField(r.userEmail),
        csvField(r.hadDiaper),
        csvField(r.diaperWet),
        csvField(r.bedWet),
        csvField(r.updatedAt),
      ].join(','),
    );
  }
  const body = '﻿' + lines.join('\n') + '\n';
  const filename = `kastelupaivakirja-${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
    body,
  };
}

app.http('export', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'export',
  handler: exportCsv,
});
