export function todayIso(): string {
  const d = new Date();
  return toIso(d);
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatFi(iso: string): string {
  const d = fromIso(iso);
  const weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
  return `${weekdays[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export function formatFiShort(iso: string): string {
  const d = fromIso(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function listLastDays(n: number): string[] {
  const out: string[] = [];
  const today = todayIso();
  for (let i = 0; i < n; i++) {
    out.push(addDays(today, -i));
  }
  return out;
}
