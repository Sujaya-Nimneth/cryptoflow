'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { z } from 'zod';
import { readLocalData, writeLocalData, type LocalDataStatus } from '@/lib/localUserData';

interface Store<T> {
  value: T;
  status: LocalDataStatus;
}

const stores = new Map<string, Store<unknown>>();
const listeners = new Map<string, Set<() => void>>();
const serverStores = new Map<string, Store<unknown>>();

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

function getStore<T>(key: string, schema: z.ZodType<T>, fallback: T): Store<T> {
  let store = stores.get(key) as Store<T> | undefined;
  if (!store) {
    store = { value: fallback, status: 'loading' };
    stores.set(key, store as Store<unknown>);
  }
  if (store.status === 'loading' && typeof window !== 'undefined') {
    let loaded: Store<T>;
    try {
      loaded = readLocalData(window.localStorage, key, schema, fallback);
    } catch {
      loaded = { value: fallback, status: 'unavailable' };
    }
    store.value = loaded.value;
    store.status = loaded.status;
  }
  return store;
}

export function useLocalUserData<T>(key: string, schema: z.ZodType<T>, fallback: T) {
  const subscribe = useCallback((listener: () => void) => {
    const keyListeners = listeners.get(key) ?? new Set<() => void>();
    keyListeners.add(listener);
    listeners.set(key, keyListeners);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      let next: Store<T>;
      try {
        next = readLocalData(window.localStorage, key, schema, fallback);
      } catch {
        next = { value: fallback, status: 'unavailable' };
      }
      stores.set(key, next);
      notify(key);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      keyListeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }, [fallback, key, schema]);
  const getSnapshot = useCallback(() => getStore(key, schema, fallback), [fallback, key, schema]);
  const getServerSnapshot = useCallback((): Store<T> => {
    let store = serverStores.get(key) as Store<T> | undefined;
    if (!store) {
      store = { value: fallback, status: 'loading' };
      serverStores.set(key, store as Store<unknown>);
    }
    return store;
  }, [fallback, key]);
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (store.status !== 'loading') return;
    let loaded: Store<T>;
    try {
      loaded = readLocalData(window.localStorage, key, schema, fallback);
    } catch {
      loaded = { value: fallback, status: 'unavailable' };
    }
    stores.set(key, loaded);
    notify(key);
  }, [fallback, key, schema, store.status]);

  const setValue = useCallback((next: T | ((current: T) => T)) => {
    const current = getStore(key, schema, fallback);
    if (current.status !== 'ready') return false;
    let value: T;
    try {
      value = typeof next === 'function' ? (next as (current: T) => T)(current.value) : next;
    } catch {
      return false;
    }
    let saved: boolean;
    try {
      saved = writeLocalData(window.localStorage, key, schema, value);
    } catch {
      saved = false;
    }
    if (!saved) {
      stores.set(key, { ...current, status: 'unavailable' });
      notify(key);
      return false;
    }
    stores.set(key, { value, status: 'ready' });
    notify(key);
    return true;
  }, [fallback, key, schema]);

  const resetInvalid = useCallback(() => {
    const current = getStore(key, schema, fallback);
    if (current.status !== 'invalid') return;
    try {
      if (writeLocalData(window.localStorage, key, schema, fallback)) {
        stores.set(key, { value: fallback, status: 'ready' });
        notify(key);
      }
    } catch {
      stores.set(key, { value: fallback, status: 'unavailable' });
      notify(key);
    }
  }, [fallback, key, schema]);

  return { value: store.value, status: store.status, setValue, resetInvalid };
}
