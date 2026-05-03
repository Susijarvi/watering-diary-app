import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { getUser } from '../shared/auth';
import {
  ensureTable,
  listEntries,
  upsertEntry,
  PARTITION_KEY,
  type DiaryEntity,
} from '../shared/storage';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface PostBody {
  date?: unknown;
  hadDiaper?: unknown;
  diaperWet?: unknown;
  bedWet?: unknown;
}

export async function entries(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const user = await getUser(req);
  if (!user) {
    return { status: 401, jsonBody: { error: 'Not authenticated' } };
  }

  await ensureTable();

  if (req.method === 'GET') {
    const rows = await listEntries();

    return {
      status: 200,
      jsonBody: rows.map((r) => ({
        date: r.rowKey,
        hadDiaper: r.hadDiaper,
        diaperWet: r.diaperWet,
        bedWet: r.bedWet,
        userEmail: r.userEmail,
        updatedAt: r.updatedAt,
      })),
    };
  }

  if (req.method === 'POST') {
    let body: PostBody;
    try {
      body = (await req.json()) as PostBody;
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON' } };
    }

    if (typeof body.date !== 'string' || !DATE_RE.test(body.date)) {
      return { status: 400, jsonBody: { error: 'date must be YYYY-MM-DD' } };
    }
    if (typeof body.hadDiaper !== 'boolean') {
      return { status: 400, jsonBody: { error: 'hadDiaper must be boolean' } };
    }
    if (typeof body.bedWet !== 'boolean') {
      return { status: 400, jsonBody: { error: 'bedWet must be boolean' } };
    }
    const diaperWet =
      body.hadDiaper === false
        ? null
        : typeof body.diaperWet === 'boolean'
          ? body.diaperWet
          : null;

    const entity: DiaryEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: body.date,
      hadDiaper: body.hadDiaper,
      diaperWet,
      bedWet: body.bedWet,
      userEmail: user.email,
      updatedAt: new Date().toISOString(),
    };

    await upsertEntry(entity);
    ctx.log(`Upserted entry user=${user.email} date=${body.date}`);

    return {
      status: 200,
      jsonBody: {
        date: entity.rowKey,
        hadDiaper: entity.hadDiaper,
        diaperWet: entity.diaperWet,
        bedWet: entity.bedWet,
        userEmail: entity.userEmail,
        updatedAt: entity.updatedAt,
      },
    };
  }

  return { status: 405, jsonBody: { error: 'Method not allowed' } };
}

app.http('entries', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'entries',
  handler: entries,
});
