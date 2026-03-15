import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { getEntry, putEntry, getAllEntryDates } from '../lib/db';
import { getToday } from '../lib/dates';
import { pushSingleEntry, isSyncEnabled } from '../lib/sync';
import type { Entry } from '../lib/types';

export function useJournal() {
  const { state, dispatch } = useApp();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const currentDateRef = useRef(state.currentDate);
  currentDateRef.current = state.currentDate;

  // Load entry when date changes
  useEffect(() => {
    if (!state.ready) return;
    (async () => {
      const entry = await getEntry(state.currentDate);
      dispatch({ type: 'SET_ENTRY', entry });
      const dates = await getAllEntryDates();
      dispatch({ type: 'SET_ENTRY_DATES', dates });
    })();
  }, [state.currentDate, state.ready, dispatch]);

  // Debounced save
  const saveEntry = useCallback(
    (entry: Entry) => {
      dispatch({ type: 'SET_ENTRY', entry });
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const now = Date.now();
        await putEntry(currentDateRef.current, entry);
        const dates = await getAllEntryDates();
        dispatch({ type: 'SET_ENTRY_DATES', dates });
        // Push to remote if sync is enabled
        if (isSyncEnabled() && state.cryptoKey && state.userId) {
          pushSingleEntry(state.cryptoKey, state.userId, currentDateRef.current, entry, now)
            .catch((err) => console.warn('Push failed:', err));
        }
      }, 300);
    },
    [dispatch, state.cryptoKey, state.userId]
  );

  // Update a specific field
  const updateField = useCallback(
    (section: 'morning' | 'evening', field: string, index: number, value: string) => {
      const newEntry = structuredClone(state.entry);
      (newEntry[section] as any)[field][index] = value;
      saveEntry(newEntry);
    },
    [state.entry, saveEntry]
  );

  // Midnight rollover
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getToday();
      if (currentDateRef.current !== today && currentDateRef.current === getToday()) {
        dispatch({ type: 'SET_DATE', date: today });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return { updateField };
}
