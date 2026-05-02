import { TableClient, odata, type TableEntity } from '@azure/data-tables';

export const TABLE_NAME = 'DiaryEntries';

export interface DiaryEntity extends TableEntity {
  partitionKey: string;     // userId (Google sub)
  rowKey: string;           // YYYY-MM-DD
  hadDiaper: boolean;
  diaperWet: boolean | null;
  bedWet: boolean;
  userEmail: string;
  updatedAt: string;
}

let cachedClient: TableClient | null = null;

export function getTableClient(): TableClient {
  if (cachedClient) return cachedClient;
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  cachedClient = TableClient.fromConnectionString(conn, TABLE_NAME, {
    allowInsecureConnection: conn.includes('UseDevelopmentStorage'),
  });
  return cachedClient;
}

export async function ensureTable(): Promise<void> {
  const client = getTableClient();
  await client.createTable();
}

export async function listEntriesForUser(userId: string): Promise<DiaryEntity[]> {
  const client = getTableClient();
  const filter = odata`PartitionKey eq ${userId}`;
  const out: DiaryEntity[] = [];
  for await (const entity of client.listEntities<DiaryEntity>({
    queryOptions: { filter },
  })) {
    out.push(entity);
  }
  return out;
}

export async function listAllEntries(): Promise<DiaryEntity[]> {
  const client = getTableClient();
  const out: DiaryEntity[] = [];
  for await (const entity of client.listEntities<DiaryEntity>()) {
    out.push(entity);
  }
  return out;
}

export async function upsertEntry(entity: DiaryEntity): Promise<void> {
  const client = getTableClient();
  await client.upsertEntity(entity, 'Replace');
}
