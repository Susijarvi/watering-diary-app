import type { DiaryEntry } from '../lib/types';
import { formatFi } from '../lib/dates';

interface Row {
  date: string;
  entry?: DiaryEntry;
}

interface Props {
  rows: Row[];
  isAdmin: boolean;
  onSelect: (iso: string) => void;
}

export function EntryList({ rows, isAdmin, onSelect }: Props) {
  if (rows.length === 0) {
    return <div className="rounded-xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200">Ei merkintöjä</div>;
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      {rows.map((row) => (
        <li key={row.date + (row.entry?.userId ?? '')}>
          <button
            onClick={() => onSelect(row.date)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100"
          >
            <span className="text-2xl">{statusIcon(row.entry)}</span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-800">{formatFi(row.date)}</span>
              <span className="block text-sm text-slate-500">{statusText(row.entry)}</span>
              {isAdmin && row.entry?.userEmail && (
                <span className="block text-xs text-slate-400">{row.entry.userEmail}</span>
              )}
            </span>
            <span className="text-slate-400">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function statusIcon(e?: DiaryEntry): string {
  if (!e) return '○';
  if (e.bedWet) return '⚠️';
  if (e.hadDiaper && e.diaperWet) return '🔵';
  return '✅';
}

function statusText(e?: DiaryEntry): string {
  if (!e) return 'Ei merkintää — napauta lisätäksesi';
  const parts: string[] = [];
  if (e.hadDiaper) {
    parts.push(e.diaperWet ? 'vaippa kastui' : 'vaippa kuiva');
  } else {
    parts.push('ei vaippaa');
  }
  parts.push(e.bedWet ? 'sänky kastui' : 'sänky kuiva');
  return parts.join(' · ');
}
