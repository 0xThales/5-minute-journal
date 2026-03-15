import { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { sync, isSyncEnabled } from '../lib/sync';

export function useSync() {
  const { state } = useApp();
  const syncingRef = useRef(false);

  // Initial sync on auth ready
  useEffect(() => {
    if (!state.ready || !state.cryptoKey || !state.userId || !isSyncEnabled()) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    sync(state.cryptoKey, state.userId)
      .catch((err) => console.warn('Sync failed:', err))
      .finally(() => { syncingRef.current = false; });
  }, [state.ready, state.cryptoKey, state.userId]);

  // Sync when coming back online
  useEffect(() => {
    if (!state.cryptoKey || !state.userId || !isSyncEnabled()) return;

    const handleOnline = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      sync(state.cryptoKey!, state.userId!)
        .catch((err) => console.warn('Sync on reconnect failed:', err))
        .finally(() => { syncingRef.current = false; });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.cryptoKey, state.userId]);
}
