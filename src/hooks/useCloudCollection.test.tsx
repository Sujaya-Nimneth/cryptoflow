import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { localWatchlistSchema } from '@/lib/userDataSchemas';
import type { WatchlistEntry } from '@/types';
import { useCloudCollection } from './useCloudCollection';

const client = {};
const controls = vi.hoisted(() => ({
  mutate: vi.fn(),
  load: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
  state: { data: undefined, error: undefined, isLoading: false } as {
    data: typeof fallback | undefined;
    error: Error | undefined;
    isLoading: boolean;
  },
}));

vi.mock('@/lib/supabase/client', () => ({ getSupabaseBrowserClient: () => client }));
vi.mock('swr', () => ({
  default: () => ({ ...controls.state, mutate: controls.mutate }),
}));

const entry = { id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin' };
const fallback = { version: 1 as const, entries: [] as WatchlistEntry[] };

function options(userId = '00000000-0000-4000-8000-00000000000a') {
  return {
    enabled: true,
    userId,
    cacheKey: `cloud:watchlist:${userId}`,
    schema: localWatchlistSchema,
    fallback,
    getItems: (state: typeof fallback) => state.entries,
    withItems: (state: typeof fallback, entries: WatchlistEntry[]) => ({ ...state, entries }),
    load: controls.load,
    insert: controls.insert,
    remove: controls.remove,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  controls.state = { data: undefined, error: undefined, isLoading: false };
});

describe('cloud collection mutations', () => {
  it('keeps pending until every overlapping mutation settles', async () => {
    let finishInsert!: () => void;
    let finishDelete!: () => void;
    controls.insert.mockImplementation(() => new Promise<void>((resolve) => { finishInsert = resolve; }));
    controls.remove.mockImplementation(() => new Promise<void>((resolve) => { finishDelete = resolve; }));
    controls.mutate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCloudCollection(options()));
    let insertion!: Promise<boolean>;
    let deletion!: Promise<boolean>;
    act(() => {
      insertion = result.current.add(entry);
      deletion = result.current.deleteItem(entry.id);
    });
    expect(result.current.pending).toBe(true);
    await act(async () => { finishInsert(); await insertion; });
    expect(result.current.pending).toBe(true);
    await act(async () => { finishDelete(); await deletion; });
    expect(result.current.pending).toBe(false);
    expect(controls.mutate).toHaveBeenCalledTimes(2);
  });

  it('reports insertion and deletion failures without changing local data', async () => {
    controls.insert.mockRejectedValue(new Error('Could not save the holding.'));
    controls.remove.mockRejectedValue(new Error('Could not remove the holding.'));
    const { result } = renderHook(() => useCloudCollection(options()));
    await act(async () => { expect(await result.current.add(entry)).toBe(false); });
    expect(result.current.error).toBe('Could not save the holding.');
    await act(async () => { expect(await result.current.deleteItem(entry.id)).toBe(false); });
    expect(result.current.error).toBe('Could not remove the holding.');
    expect(result.current.value).toEqual(fallback);
    expect(result.current.pending).toBe(false);
  });

  it('does not report success when post-mutation refresh fails', async () => {
    controls.insert.mockResolvedValue(undefined);
    controls.mutate.mockRejectedValue(new Error('Could not load your cloud watchlist.'));
    const { result } = renderHook(() => useCloudCollection(options()));
    await act(async () => { expect(await result.current.add(entry)).toBe(false); });
    expect(controls.mutate).toHaveBeenCalledWith(undefined, { throwOnError: true });
    expect(result.current.error).toBe('Could not load your cloud watchlist.');
    expect(result.current.pending).toBe(false);
  });

  it('does not let an old account mutation report success or clear pending', async () => {
    const finishers: Array<() => void> = [];
    let insertions = 0;
    controls.insert.mockImplementation(() => {
      insertions += 1;
      return new Promise<void>((resolve) => { finishers[insertions - 1] = resolve; });
    });
    controls.mutate.mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ userId }) => useCloudCollection(options(userId)),
      { initialProps: { userId: '00000000-0000-4000-8000-00000000000a' } }
    );
    let insertion!: Promise<boolean>;
    act(() => { insertion = result.current.add(entry); });
    rerender({ userId: '00000000-0000-4000-8000-00000000000b' });
    await waitFor(() => expect(result.current.pending).toBe(false));
    let newerInsertion!: Promise<boolean>;
    act(() => { newerInsertion = result.current.add(entry); });
    await act(async () => { finishers[0](); expect(await insertion).toBe(false); });
    expect(result.current.pending).toBe(true);
    await act(async () => { finishers[1](); expect(await newerInsertion).toBe(true); });
    expect(result.current.pending).toBe(false);
  });

  it('exposes cloud loading and outage states separately from mutation errors', () => {
    controls.state = { data: undefined, error: new Error('offline'), isLoading: false };
    const { result, rerender } = renderHook(() => useCloudCollection(options()));
    expect(result.current.status).toBe('unavailable');
    expect(result.current.error).toContain('device-local data is unchanged');
    controls.state = { data: undefined, error: undefined, isLoading: true };
    rerender();
    expect(result.current.status).toBe('loading');
  });
});
