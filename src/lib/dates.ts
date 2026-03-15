export function getToday(): string {
  const d = new Date();
  return formatDate(d);
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function displayDate(str: string, dateLang: string): string {
  const d = parseDate(str);
  return d.toLocaleDateString(dateLang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function getDayOfYear(str: string): number {
  const d = parseDate(str);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function addDays(str: string, n: number): string {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}
