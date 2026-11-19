import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Watchlist from './Watchlist';

const collection = vi.hoisted(() => ({
  entries: [{ id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin' }],
  addEntry: vi.fn(),
  deleteEntry: vi.fn(),
}));

vi.mock('@/hooks/useWatchlistData', () => ({
  useWatchlistData: () => ({
    entries: collection.entries,
    status: 'ready',
    pending: false,
    error: null,
    addEntry: collection.addEntry,
    deleteEntry: collection.deleteEntry,
    resetInvalid: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMarketCoins', () => ({
  useMarketCoins: () => ({
    coins: new Map(),
    loading: false,
    error: null,
    updatedAt: undefined,
    freshness: 'live',
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  collection.entries = [{ id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin' }];
});

describe('recoverable watchlist deletion', () => {
  it('focuses Undo and restores the original entry on keyboard activation', async () => {
    collection.deleteEntry.mockResolvedValue(true);
    collection.addEntry.mockResolvedValue(true);
    render(<Watchlist />);
    const remove = screen.getByRole('button', { name: 'Remove Bitcoin from watchlist' });
    remove.focus();
    fireEvent.click(remove);
    const undo = await screen.findByRole('button', { name: 'Undo', exact: true });
    await waitFor(() => expect(undo).toHaveFocus());
    expect(collection.deleteEntry).toHaveBeenCalledWith(collection.entries[0].id);
    undo.focus();
    fireEvent.keyDown(undo, { key: 'Enter' });
    fireEvent.click(undo);
    await waitFor(() => expect(collection.addEntry).toHaveBeenCalledWith(collection.entries[0]));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Undo', exact: true })).not.toBeInTheDocument());
    expect(remove).toHaveFocus();
  });

  it('keeps failed restoration available for another attempt', async () => {
    collection.deleteEntry.mockResolvedValue(true);
    collection.addEntry.mockResolvedValue(false);
    render(<Watchlist />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Bitcoin from watchlist' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Undo', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not restore Bitcoin from your watchlist. Try Undo again.');
    expect(screen.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
  });

  it('expires the undo opportunity after fifteen seconds', async () => {
    vi.useFakeTimers();
    collection.deleteEntry.mockResolvedValue(true);
    render(<Watchlist />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Bitcoin from watchlist' }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('button', { name: 'Undo', exact: true })).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.queryByRole('button', { name: 'Undo', exact: true })).not.toBeInTheDocument();
    expect(collection.addEntry).not.toHaveBeenCalled();
  });
});
