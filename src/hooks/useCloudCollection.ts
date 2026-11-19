'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LocalDataStatus } from '@/lib/localUserData';

interface CloudCollectionOptions<TItem extends { id: string }, TState> {
  enabled: boolean;
  userId: string | null;
  cacheKey: string;
  schema: z.ZodType<TState>;
  fallback: TState;
  getItems: (state: TState) => TItem[];
  withItems: (state: TState, items: TItem[]) => TState;
  load: (client: ReturnType<typeof getSupabaseBrowserClient>, userId: string) => Promise<TItem[]>;
  insert: (client: ReturnType<typeof getSupabaseBrowserClient>, item: TItem) => Promise<TItem>;
  remove: (client: ReturnType<typeof getSupabaseBrowserClient>, userId: string, id: string) => Promise<void>;
}

export function useCloudCollection<TItem extends { id: string }, TState>({
  enabled,
  userId,
  cacheKey,
  schema,
  fallback,
  getItems,
  withItems,
  load,
  insert,
  remove,
}: CloudCollectionOptions<TItem, TState>) {
  const client = useMemo(() => (enabled && userId ? getSupabaseBrowserClient() : null), [enabled, userId]);
  const { data, error, isLoading, mutate } = useSWR(
    enabled && userId && client ? cacheKey : null,
    async () => {
      const items = await load(client!, userId!);
      return schema.parse(withItems(fallback, items));
    },
    { revalidateOnFocus: true, keepPreviousData: true }
  );
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const add = useCallback(async (item: TItem) => {
    if (!client || !userId) return false;
    setPending(true);
    setMutationError(null);
    try {
      await insert(client, item);
      await mutate();
      return true;
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Could not save cloud data.');
      return false;
    } finally {
      setPending(false);
    }
  }, [client, insert, mutate, userId]);

  const deleteItem = useCallback(async (id: string) => {
    if (!client || !userId) return false;
    setPending(true);
    setMutationError(null);
    try {
      await remove(client, userId, id);
      await mutate();
      return true;
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Could not update cloud data.');
      return false;
    } finally {
      setPending(false);
    }
  }, [client, mutate, remove, userId]);

  const status: LocalDataStatus = isLoading ? 'loading' : error ? 'unavailable' : 'ready';
  return {
    value: data ?? fallback,
    status,
    pending,
    error: mutationError ?? (error ? 'Cloud data is unavailable. Your device-local data is unchanged.' : null),
    add,
    deleteItem,
    getItems,
    refresh: mutate,
  };
}
