import { getAllEntryDates, getEntry } from './db';
import { encrypt, decrypt } from './crypto';
import { putEntry } from './db';
import type { Entry } from './types';

interface ExportData {
  version: 1;
  exportedAt: string;
  entries: Record<string, string>; // date -> encrypted blob
}

interface PlaintextExportData {
  version: 1;
  exportedAt: string;
  entries: Record<string, Entry>;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export all entries as encrypted JSON (requires passphrase to read) */
export async function exportEncrypted(cryptoKey: CryptoKey): Promise<void> {
  const dates = await getAllEntryDates();
  const entries: Record<string, string> = {};

  for (const date of dates) {
    const entry = await getEntry(date);
    entries[date] = await encrypt(cryptoKey, JSON.stringify(entry));
  }

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  download(`journal-backup-${dateStr}.json`, JSON.stringify(data, null, 2));
}

/** Export all entries as readable plaintext JSON */
export async function exportPlaintext(): Promise<void> {
  const dates = await getAllEntryDates();
  const entries: Record<string, Entry> = {};

  for (const date of dates) {
    entries[date] = await getEntry(date);
  }

  const data: PlaintextExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  download(`journal-${dateStr}.json`, JSON.stringify(data, null, 2));
}

/** Import encrypted backup (merge, last-write-wins) */
export async function importEncrypted(file: File, cryptoKey: CryptoKey): Promise<number> {
  const text = await file.text();
  const data: ExportData = JSON.parse(text);
  let count = 0;

  for (const [date, blob] of Object.entries(data.entries)) {
    const json = await decrypt(cryptoKey, blob);
    const entry: Entry = JSON.parse(json);
    await putEntry(date, entry);
    count++;
  }

  return count;
}

/** Import plaintext backup */
export async function importPlaintext(file: File): Promise<number> {
  const text = await file.text();
  const data: PlaintextExportData = JSON.parse(text);
  let count = 0;

  for (const [date, entry] of Object.entries(data.entries)) {
    await putEntry(date, entry);
    count++;
  }

  return count;
}
