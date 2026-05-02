import { useMemo, useState } from 'react';
import type { AuthInfo, DiaryEntry } from '../lib/types';
import { exportCsvUrl, logoutUrl } from '../lib/api';
import { addDays, formatFi, listLastDays, todayIso } from '../lib/dates';
import { EntryList } from './EntryList';

interface Props {
  auth: AuthInfo;
  isAdmin: boolean;
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
  onAddToday: () => void;
  onEditDate: (iso: string) => void;
}

const RECENT_DAYS = 30;

export function MainView({
  auth,
  isAdmin,
  entries,
  loading,
  error,
  onReload,
  onAddToday,
  onEditDate,
}: Props) {
  const [showAllMissing, setShowAllMissing] = useState(false);

  const today = todayIso();
  const todayEntry = entries.find((e) => e.date === today);

  // Combine real entries with missing days for last N days, plus older entries.
  const recentDays = useMemo(() => listLastDays(RECENT_DAYS), []);
  const recentEntryByDate = useMemo(() => {
    const m = new Map<string, DiaryEntry>();
    entries.forEach((e) => m.set(e.date, e));
    return m;
  }, [entries]);

  const recentRows = recentDays.map((iso) => ({
    date: iso,
    entry: recentEntryByDate.get(iso),
  }));

  const olderEntries = entries.filter(
    (e) => e.date < addDays(today, -(RECENT_DAYS - 1)),
  );

  const missingCount = recentRows.filter((r) => !r.entry).length;

  return (
    <div className="mx-auto min-h-screen max-w-xl">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-b from-brand-700 to-brand-600 px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)] text-white shadow-lg">
        <div>
          <div className="text-xs text-brand-100">🌙 Kastelupäiväkirja</div>
          <div className="text-sm font-medium">{auth.userDetails}</div>
        </div>
        <a href={logoutUrl()} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10">
          Kirjaudu ulos
        </a>
      </header>

      <main className="space-y-6 px-4 py-6">
        <button onClick={onAddToday} className="btn-primary w-full text-xl">
          {todayEntry ? '✏️ Muokkaa tänään' : '✚ Kirjaa tänään'}
        </button>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}{' '}
            <button onClick={() => void onReload()} className="font-bold underline">
              Yritä uudelleen
            </button>
          </div>
        )}

        {loading && entries.length === 0 ? (
          <div className="py-10 text-center text-slate-500">Ladataan merkintöjä…</div>
        ) : (
          <>
            {missingCount > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Puuttuvat päivät
                </h2>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <p className="mb-2 text-sm text-slate-600">
                    {missingCount} päivää viime {RECENT_DAYS} päivän ajalta puuttuu
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentRows
                      .filter((r) => !r.entry)
                      .slice(0, showAllMissing ? undefined : 6)
                      .map((r) => (
                        <button
                          key={r.date}
                          onClick={() => onEditDate(r.date)}
                          className="rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                        >
                          {formatFi(r.date)}
                        </button>
                      ))}
                  </div>
                  {missingCount > 6 && (
                    <button
                      onClick={() => setShowAllMissing((v) => !v)}
                      className="mt-2 text-sm font-medium text-brand-700 hover:underline"
                    >
                      {showAllMissing ? 'Näytä vähemmän' : `Näytä kaikki (${missingCount})`}
                    </button>
                  )}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                Viime {RECENT_DAYS} päivää
              </h2>
              <EntryList
                rows={recentRows}
                isAdmin={isAdmin}
                onSelect={(iso) => onEditDate(iso)}
              />
            </section>

            {olderEntries.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Vanhemmat merkinnät
                </h2>
                <EntryList
                  rows={olderEntries.map((e) => ({ date: e.date, entry: e }))}
                  isAdmin={isAdmin}
                  onSelect={(iso) => onEditDate(iso)}
                />
              </section>
            )}

            {isAdmin && (
              <a
                href={exportCsvUrl()}
                className="btn-secondary w-full"
                download="kastelupaivakirja.csv"
              >
                ⬇ Lataa CSV
              </a>
            )}
          </>
        )}
      </main>
    </div>
  );
}
