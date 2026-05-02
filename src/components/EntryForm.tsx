import { useState } from 'react';
import type { DiaryEntry } from '../lib/types';
import { formatFi, todayIso } from '../lib/dates';

interface Props {
  initial: DiaryEntry;
  onSave: (e: DiaryEntry) => Promise<void>;
  onCancel: () => void;
}

export function EntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initial.date);
  const [hadDiaper, setHadDiaper] = useState(initial.hadDiaper);
  const [diaperWet, setDiaperWet] = useState<boolean | null>(initial.diaperWet);
  const [bedWet, setBedWet] = useState(initial.bedWet);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        date,
        hadDiaper,
        diaperWet: hadDiaper ? diaperWet ?? false : null,
        bedWet,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tallennus epäonnistui');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-brand-700 to-brand-600 px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] text-white shadow-lg">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-2xl hover:bg-white/10"
          aria-label="Peruuta"
        >
          ←
        </button>
        <div>
          <div className="text-xs text-brand-100">Merkintä</div>
          <div className="font-semibold">{formatFi(date)}</div>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-6 px-4 py-6">
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-600">
            Päivämäärä
          </label>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-lg focus:border-brand-600 focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-600">
            Oliko vaippa?
          </legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setHadDiaper(true);
                if (diaperWet === null) setDiaperWet(false);
              }}
              className={`toggle-pill ${hadDiaper ? 'toggle-pill-active' : ''}`}
            >
              Kyllä
            </button>
            <button
              type="button"
              onClick={() => {
                setHadDiaper(false);
                setDiaperWet(null);
              }}
              className={`toggle-pill ${!hadDiaper ? 'toggle-pill-active' : ''}`}
            >
              Ei
            </button>
          </div>
        </fieldset>

        {hadDiaper && (
          <fieldset>
            <legend className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-600">
              Kastuiko vaippa?
            </legend>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDiaperWet(true)}
                className={`toggle-pill ${diaperWet === true ? 'toggle-pill-active' : ''}`}
              >
                Kyllä
              </button>
              <button
                type="button"
                onClick={() => setDiaperWet(false)}
                className={`toggle-pill ${diaperWet === false ? 'toggle-pill-active' : ''}`}
              >
                Ei
              </button>
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-600">
            Kastuiko sänky?
          </legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBedWet(true)}
              className={`toggle-pill ${bedWet ? 'toggle-pill-active' : ''}`}
            >
              Kyllä
            </button>
            <button
              type="button"
              onClick={() => setBedWet(false)}
              className={`toggle-pill ${!bedWet ? 'toggle-pill-active' : ''}`}
            >
              Ei
            </button>
          </div>
        </fieldset>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Tallennetaan…' : 'Tallenna'}
          </button>
          <button type="button" onClick={onCancel} className="btn-ghost w-full">
            Peruuta
          </button>
        </div>
      </form>
    </div>
  );
}
