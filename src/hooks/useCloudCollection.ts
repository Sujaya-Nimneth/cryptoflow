'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [mutationOwner, setMutationOwner] = useState<string | null>(userId);
  const activeMutations = useRef(0);
  const mutationGeneration = useRef(0);

  if (mutationOwner !== userId) {
    setMutationOwner(userId);
    setPending(false);
    setMutationError(null);
  }

  useEffect(() => {
    mutationGeneration.current += 1;
    activeMutations.current = 0;
  }, [client, userId]);

  const beginMutation = useCallback(() => {
    activeMutations.current += 1;
    setPending(true);
    setMutationError(null);
    return mutationGeneration.current;
  }, []);

  const finishMutation = useCallback((generation: number) => {
    activeMutations.current = Math.max(0, activeMutations.current - 1);
    if (generation === mutationGeneration.current) {
      setPending(activeMutations.current > 0);
    }
  }, []);

  const reportMutationError = useCallback((generation: number, cause: unknown, fallback: string) => {
    if (generation === mutationGeneration.current) {
      setMutationError(cause instanceof Error ? cause.message : fallback);
    }
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    await mutate(undefined, { throwOnError: true });
  }, [mutate]);

  const add = useCallback(async (item: TItem) => {
    if (!client || !userId) return false;
    const generation = beginMutation();
    try {
      await insert(client, item);
      await refreshAfterMutation();
      if (generation !== mutationGeneration.current) return false;
      return true;
    } catch (cause) {
      reportMutationError(generation, cause, 'Could not save cloud data.');
      return false;
    } finally {
      finishMutation(generation);
    }
  }, [beginMutation, client, finishMutation, insert, refreshAfterMutation, reportMutationError, userId]);

  const deleteItem = useCallback(async (id: string) => {
    if (!client || !userId) return false;
    const generation = beginMutation();
    try {
      await remove(client, userId, id);
      await refreshAfterMutation();
      if (generation !== mutationGeneration.current) return false;
      return true;
    } catch (cause) {
      reportMutationError(generation, cause, 'Could not update cloud data.');
      return false;
    } finally {
      finishMutation(generation);
    }
  }, [beginMutation, client, finishMutation, refreshAfterMutation, remove, reportMutationError, userId]);

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
