import { TableClient, odata, type TableEntity } from '@azure/data-tables';

export const TABLE_NAME = 'DiaryEntries';

// All entries belong to a single shared diary (one child) — both parent and
// child see/edit the same rows. userEmail still records who entered each row.
export const PARTITION_KEY = 'diary';

export interface DiaryEntity extends TableEntity {
  partitionKey: string;     // always PARTITION_KEY
  rowKey: string;           // YYYY-MM-DD
  hadDiaper: boolean;
  diaperWet: boolean | null;
  bedWet: boolean;
  userEmail: string;        // who entered this row
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

export async function listEntries(): Promise<DiaryEntity[]> {
  const client = getTableClient();
  const filter = odata`PartitionKey eq ${PARTITION_KEY}`;
  const out: DiaryEntity[] = [];
  for await (const entity of client.listEntities<DiaryEntity>({
    queryOptions: { filter },
  })) {
    out.push(entity);
  }
  return out;
}

export async function upsertEntry(entity: DiaryEntity): Promise<void> {
  const client = getTableClient();
  await client.upsertEntity(entity, 'Replace');
}
