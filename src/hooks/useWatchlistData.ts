'use client';

import { useCallback } from 'react';
import { useLocalUserData } from '@/hooks/useLocalUserData';
import { useCloudCollection } from '@/hooks/useCloudCollection';
import { useUserDataContext } from '@/components/UserDataProvider';
import { LOCAL_USER_DATA_KEYS } from '@/lib/localUserData';
import { localWatchlistSchema } from '@/lib/userDataSchemas';
import {
  deleteCloudWatchlistEntry,
  insertCloudWatchlistEntry,
  loadCloudWatchlist,
} from '@/lib/supabase/userData';
import type { WatchlistEntry } from '@/types';

const EMPTY_WATCHLIST = { version: 1 as const, entries: [] as WatchlistEntry[] };

export function useWatchlistData() {
  const { mode, identity } = useUserDataContext();
  const local = useLocalUserData(LOCAL_USER_DATA_KEYS.watchlist, localWatchlistSchema, EMPTY_WATCHLIST);
  const cloud = useCloudCollection({
    enabled: mode === 'cloud',
    userId: identity?.id ?? null,
    cacheKey: `cloud:watchlist:${identity?.id ?? 'anonymous'}`,
    schema: localWatchlistSchema,
    fallback: EMPTY_WATCHLIST,
    getItems: (state) => state.entries,
    withItems: (state, entries) => ({ ...state, entries }),
    load: loadCloudWatchlist,
    insert: insertCloudWatchlistEntry,
    remove: deleteCloudWatchlistEntry,
  });

  const addEntry = useCallback(async (entry: WatchlistEntry) => {
    if (mode === 'cloud') return cloud.add(entry);
    return local.setValue((current) => ({ version: 1, entries: [...current.entries, entry] }));
  }, [cloud, local, mode]);

  const deleteEntry = useCallback(async (id: string) => {
    if (mode === 'cloud') return cloud.deleteItem(id);
    return local.setValue((current) => ({ version: 1, entries: current.entries.filter((entry) => entry.id !== id) }));
  }, [cloud, local, mode]);

  if (mode === 'cloud') {
    return {
      entries: cloud.value.entries,
      status: cloud.status,
      pending: cloud.pending,
      error: cloud.error,
      addEntry,
      deleteEntry,
      resetInvalid: () => undefined,
    };
  }
  return {
    entries: local.value.entries,
    status: local.status,
    pending: false,
    error: null,
    addEntry,
    deleteEntry,
    resetInvalid: local.resetInvalid,
  };
}
