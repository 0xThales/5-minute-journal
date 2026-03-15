import { openDB, type IDBPDatabase } from 'idb';
import { type Entry, emptyEntry, normalizeEntry } from './types';

const DB_NAME = 'fmj';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function getEntry(date: string): Promise<Entry> {
  const db = await getDB();
  const record = await db.get('entries', date);
  if (!record) return emptyEntry();
  return normalizeEntry(record.entry);
}

export async function putEntry(date: string, entry: Entry): Promise<void> {
  const db = await getDB();
  await db.put('entries', { entry, updatedAt: Date.now() }, date);
}

export async function getAllEntryDates(): Promise<string[]> {
  const db = await getDB();
  const keys = await db.getAllKeys('entries');
  return (keys as string[]).sort();
}

export async function getMeta(key: string): Promise<any> {
  const db = await getDB();
  return db.get('meta', key);
}

export async function setMeta(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('meta', value, key);
}

/** Migrate existing localStorage data into IndexedDB */
export async function migrateFromLocalStorage(): Promise<void> {
  const db = await getDB();
  const migrated = await db.get('meta', 'migrated');
  if (migrated) return;

  const keys = Object.keys(localStorage).filter(
    (k) => k.startsWith('journal:') && !['journal:theme', 'journal:lang', 'journal:guided'].includes(k)
  );

  for (const k of keys) {
    const date = k.replace('journal:', '');
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const entry = normalizeEntry(JSON.parse(raw));
    await db.put('entries', { entry, updatedAt: Date.now() }, date);
  }

  // Migrate preferences
  const theme = localStorage.getItem('journal:theme');
  const lang = localStorage.getItem('journal:lang');
  const guided = localStorage.getItem('journal:guided');
  if (theme) await db.put('meta', theme, 'theme');
  if (lang) await db.put('meta', lang, 'lang');
  if (guided) await db.put('meta', true, 'guided');

  await db.put('meta', true, 'migrated');
}
