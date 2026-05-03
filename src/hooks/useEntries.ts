import { useCallback, useEffect, useState } from 'react';
import { fetchEntries, saveEntry } from '../lib/api';
import type { DiaryEntry } from '../lib/types';

interface EntriesState {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (e: DiaryEntry) => Promise<void>;
  byDate: (iso: string) => DiaryEntry | undefined;
}

export function useEntries(enabled: boolean): EntriesState {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries();
      data.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Virhe');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const save = useCallback(
    async (entry: DiaryEntry) => {
      const saved = await saveEntry(entry);
      setEntries((prev) => {
        const others = prev.filter(
          (e) => !(e.date === saved.date && (e.userId ?? '') === (saved.userId ?? '')),
        );
        return [saved, ...others].sort((a, b) => b.date.localeCompare(a.date));
      });
    },
    [],
  );

  const byDate = useCallback(
    (iso: string) => entries.find((e) => e.date === iso),
    [entries],
  );

  return { entries, loading, error, reload, save, byDate };
}
