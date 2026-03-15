import { openDB } from 'idb';
import { encrypt, decrypt } from './crypto';
import { getEntry, putEntry, getAllEntryDates, setMeta } from './db';
import type { Entry } from './types';

const SYNC_URL = import.meta.env.VITE_SYNC_URL || '';

function headers(userId: string) {
  return { 'Content-Type': 'application/json', 'X-User-Id': userId };
}

export function isSyncEnabled(): boolean {
  return !!SYNC_URL;
}

/** Fetch remote manifest: { dates: { "YYYY-MM-DD": updatedAt } } */
async function fetchManifest(userId: string): Promise<Record<string, number>> {
  const res = await fetch(`${SYNC_URL}/manifest`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch manifest');
  const data = await res.json();
  return data.dates || {};
}

/** Fetch remote entries updated since a timestamp */
async function fetchEntries(userId: string, since: number): Promise<Record<string, { blob: string; updatedAt: number }>> {
  const res = await fetch(`${SYNC_URL}/entries?since=${since}`, { headers: headers(userId) });
  if (!res.ok) throw new Error('Failed to fetch entries');
  const data = await res.json();
  return data.entries || {};
}

/** Push entries to remote */
async function pushEntries(userId: string, entries: Record<string, { blob: string; updatedAt: number }>): Promise<void> {
  const res = await fetch(`${SYNC_URL}/entries`, {
    method: 'PUT',
    headers: headers(userId),
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error('Failed to push entries');
}

/** Full sync: pull remote changes, push local changes. Last-write-wins per entry. */
export async function sync(cryptoKey: CryptoKey, userId: string): Promise<void> {
  if (!SYNC_URL) return;

  const remoteManifest = await fetchManifest(userId);
  const localDates = await getAllEntryDates();

  // Build local manifest from IndexedDB
  const db = await openDB('fmj', 1);
  const localManifest: Record<string, number> = {};
  for (const date of localDates) {
    const record = await db.get('entries', date);
    if (record) localManifest[date] = record.updatedAt;
  }

  // Pull: remote entries newer than local
  const toPull: string[] = [];
  for (const [date, remoteTs] of Object.entries(remoteManifest)) {
    const localTs = localManifest[date] || 0;
    if (remoteTs > localTs) toPull.push(date);
  }

  if (toPull.length > 0) {
    const minTs = Math.min(...toPull.map((d) => localManifest[d] || 0));
    const remoteEntries = await fetchEntries(userId, minTs);
    for (const [date, { blob }] of Object.entries(remoteEntries)) {
      const json = await decrypt(cryptoKey, blob);
      const entry: Entry = JSON.parse(json);
      await putEntry(date, entry);
    }
  }

  // Push: local entries newer than remote
  const toPush: Record<string, { blob: string; updatedAt: number }> = {};
  for (const [date, localTs] of Object.entries(localManifest)) {
    const remoteTs = remoteManifest[date] || 0;
    if (localTs > remoteTs) {
      const entry = await getEntry(date);
      const blob = await encrypt(cryptoKey, JSON.stringify(entry));
      toPush[date] = { blob, updatedAt: localTs };
    }
  }

  if (Object.keys(toPush).length > 0) {
    await pushEntries(userId, toPush);
  }

  await setMeta('lastSyncedAt', Date.now());
}

/** Push a single entry immediately after save */
export async function pushSingleEntry(cryptoKey: CryptoKey, userId: string, date: string, entry: Entry, updatedAt: number): Promise<void> {
  if (!SYNC_URL) return;
  const blob = await encrypt(cryptoKey, JSON.stringify(entry));
  await pushEntries(userId, { [date]: { blob, updatedAt } });
}
