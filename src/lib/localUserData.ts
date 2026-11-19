import type { z } from 'zod';

export const LOCAL_USER_DATA_KEYS = {
  portfolio: 'cryptoflow:local:portfolio',
  watchlist: 'cryptoflow:local:watchlist',
  alerts: 'cryptoflow:local:alerts',
} as const;

export type LocalDataStatus = 'loading' | 'ready' | 'unavailable' | 'invalid';

export function readLocalData<T>(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  schema: z.ZodType<T>,
  fallback: T
): { value: T; status: Exclude<LocalDataStatus, 'loading'> } {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { value: fallback, status: 'unavailable' };
  }
  if (raw === null) return { value: fallback, status: 'ready' };
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return { value: parsed.data, status: 'ready' };
  } catch {
    return { value: fallback, status: 'invalid' };
  }
  return { value: fallback, status: 'invalid' };
}

export function writeLocalData<T>(
  storage: Pick<Storage, 'setItem'>,
  key: string,
  schema: z.ZodType<T>,
  value: T
): boolean {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return false;
  try {
    storage.setItem(key, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
}
