import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { LoginPage } from './components/LoginPage';
import { MainView } from './components/MainView';
import { EntryForm } from './components/EntryForm';
import { todayIso } from './lib/dates';
import type { DiaryEntry } from './lib/types';

export default function App() {
  const auth = useAuth();
  const entries = useEntries(auth.user !== null);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">Ladataan…</div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <LoginPage
        googleClientId={auth.googleClientId}
        onCredential={auth.loginWithCredential}
      />
    );
  }

  if (editingDate) {
    const existing = entries.byDate(editingDate);
    const initial: DiaryEntry =
      existing ??
      { date: editingDate, hadDiaper: false, diaperWet: null, bedWet: false };

    return (
      <EntryForm
        initial={initial}
        onCancel={() => setEditingDate(null)}
        onSave={async (e) => {
          await entries.save(e);
          setEditingDate(null);
        }}
      />
    );
  }

  return (
    <MainView
      user={auth.user}
      isAdmin={auth.isAdmin}
      onLogout={auth.logout}
      entries={entries.entries}
      loading={entries.loading}
      error={entries.error}
      onReload={entries.reload}
      onAddToday={() => setEditingDate(todayIso())}
      onEditDate={(iso) => setEditingDate(iso)}
    />
  );
}
