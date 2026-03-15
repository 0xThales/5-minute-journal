export interface Entry {
  morning: {
    grateful: string[];
    great: string[];
    affirmation: string[];
  };
  evening: {
    amazing: string[];
    better: string[];
  };
}

export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark';

export function emptyEntry(): Entry {
  return {
    morning: { grateful: ['', '', ''], great: ['', '', ''], affirmation: ['', ''] },
    evening: { amazing: ['', '', ''], better: ['', ''] },
  };
}

/** Normalize legacy localStorage formats */
export function normalizeEntry(entry: any): Entry {
  const e = { ...entry };
  if (e.evening?.highlights) {
    e.evening.amazing = e.evening.highlights;
    delete e.evening.highlights;
  }
  if (e.evening && typeof e.evening.learned === 'string') {
    e.evening.better = [e.evening.learned, ''];
    delete e.evening.learned;
  }
  if (e.morning && typeof e.morning.affirmation === 'string') {
    e.morning.affirmation = [e.morning.affirmation, ''];
  }
  if (e.evening && typeof e.evening.better === 'string') {
    e.evening.better = [e.evening.better, ''];
  }
  return e as Entry;
}
