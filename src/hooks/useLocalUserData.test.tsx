import { act, cleanup, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localPortfolioSchema } from '@/lib/userDataSchemas';

const fallback = { version: 1 as const, holdings: [] };
const holding = { id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 };
const value = { version: 1 as const, holdings: [holding] };

beforeEach(() => localStorage.clear());
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadHook() {
  return (await import('./useLocalUserData')).useLocalUserData;
}

describe('device-local storage hook', () => {
  it('hydrates persisted data after the server snapshot', async () => {
    localStorage.setItem('test:portfolio', JSON.stringify(value));
    const useLocalUserData = await loadHook();
    const { result } = renderHook(() => useLocalUserData('test:portfolio', localPortfolioSchema, fallback));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.value).toEqual(value);
  });

  it('synchronizes matching storage events and storage clears', async () => {
    const useLocalUserData = await loadHook();
    const { result } = renderHook(() => useLocalUserData('test:portfolio', localPortfolioSchema, fallback));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    localStorage.setItem('test:portfolio', JSON.stringify(value));
    act(() => fireEvent(window, new StorageEvent('storage', { key: 'test:portfolio' })));
    expect(result.current.value).toEqual(value);
    localStorage.setItem('other:key', 'ignored');
    act(() => fireEvent(window, new StorageEvent('storage', { key: 'other:key' })));
    expect(result.current.value).toEqual(value);
    localStorage.clear();
    act(() => fireEvent(window, new StorageEvent('storage', { key: null })));
    expect(result.current.value).toEqual(fallback);
  });

  it('preserves invalid data until reset is explicitly requested', async () => {
    localStorage.setItem('test:portfolio', '{broken');
    const useLocalUserData = await loadHook();
    const { result } = renderHook(() => useLocalUserData('test:portfolio', localPortfolioSchema, fallback));
    await waitFor(() => expect(result.current.status).toBe('invalid'));
    expect(result.current.setValue(() => value)).toBe(false);
    expect(localStorage.getItem('test:portfolio')).toBe('{broken');
    act(() => result.current.resetInvalid());
    expect(result.current.status).toBe('ready');
    expect(JSON.parse(localStorage.getItem('test:portfolio')!)).toEqual(fallback);
  });

  it('reports read and write failures without throwing', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const useLocalUserData = await loadHook();
    const { result } = renderHook(() => useLocalUserData('test:portfolio', localPortfolioSchema, fallback));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(result.current.setValue(value)).toBe(false);
    act(() => result.current.resetInvalid());
    expect(result.current.status).toBe('unavailable');
  });

  it('keeps the last valid snapshot when another tab loses storage access', async () => {
    localStorage.setItem('test:portfolio', JSON.stringify(value));
    const useLocalUserData = await loadHook();
    const { result } = renderHook(() => useLocalUserData('test:portfolio', localPortfolioSchema, fallback));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    act(() => fireEvent(window, new StorageEvent('storage', { key: 'test:portfolio' })));
    expect(result.current.status).toBe('unavailable');
    expect(result.current.value).toEqual(fallback);
  });
});
