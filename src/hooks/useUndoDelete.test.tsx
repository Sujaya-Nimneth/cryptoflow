import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UNDO_DELETE_MS, useUndoDelete } from './useUndoDelete';

const item = { id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin' };
const describeItem = () => 'Bitcoin';

function options() {
  return {
    items: [item],
    remove: vi.fn().mockResolvedValue(true),
    restore: vi.fn().mockResolvedValue(true),
    describe: describeItem,
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('undo lifecycle', () => {
  it('ignores overlapping deletes and concurrent undo requests', async () => {
    let finishDelete!: (saved: boolean) => void;
    let finishRestore!: (saved: boolean) => void;
    const controls = options();
    controls.remove.mockImplementation(() => new Promise<boolean>((resolve) => { finishDelete = resolve; }));
    controls.restore.mockImplementation(() => new Promise<boolean>((resolve) => { finishRestore = resolve; }));
    const { result } = renderHook(() => useUndoDelete(controls));
    let firstDelete!: Promise<boolean>;
    act(() => { firstDelete = result.current.deleteItem(item.id); });
    await act(async () => { expect(await result.current.deleteItem(item.id)).toBe(false); });
    expect(controls.remove).toHaveBeenCalledTimes(1);
    await act(async () => { finishDelete(true); await firstDelete; });

    let firstUndo!: Promise<boolean>;
    act(() => { firstUndo = result.current.undo(); });
    await act(async () => { expect(await result.current.undo()).toBe(false); });
    expect(controls.restore).toHaveBeenCalledTimes(1);
    await act(async () => { finishRestore(true); await firstUndo; });
    expect(result.current.deleted).toBeNull();
  });

  it('expires after fifteen seconds without restoring the item', async () => {
    vi.useFakeTimers();
    const controls = options();
    const { result } = renderHook(() => useUndoDelete(controls));
    await act(async () => { await result.current.deleteItem(item.id); });
    await act(async () => { await vi.advanceTimersByTimeAsync(UNDO_DELETE_MS); });
    expect(result.current.deleted).toBeNull();
    await act(async () => { expect(await result.current.undo()).toBe(false); });
    expect(controls.restore).not.toHaveBeenCalled();
  });

  it('lets an in-flight restore finish after the deadline', async () => {
    vi.useFakeTimers();
    let finishRestore!: (saved: boolean) => void;
    const controls = options();
    controls.restore.mockImplementation(() => new Promise<boolean>((resolve) => { finishRestore = resolve; }));
    const { result } = renderHook(() => useUndoDelete(controls));
    await act(async () => { await result.current.deleteItem(item.id); });
    let pendingUndo!: Promise<boolean>;
    act(() => { pendingUndo = result.current.undo(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(UNDO_DELETE_MS + 1); });
    expect(result.current.deleted).not.toBeNull();
    await act(async () => { finishRestore(true); await pendingUndo; });
    expect(result.current.deleted).toBeNull();
  });

  it('rejects an expired undo click even if a delayed timer has not fired', async () => {
    vi.useFakeTimers();
    const controls = options();
    const { result } = renderHook(() => useUndoDelete(controls));
    await act(async () => { await result.current.deleteItem(item.id); });
    vi.setSystemTime(Date.now() + UNDO_DELETE_MS);
    await act(async () => { expect(await result.current.undo()).toBe(false); });
    expect(result.current.deleted).toBeNull();
    expect(controls.restore).not.toHaveBeenCalled();
  });

  it('expires when hidden but preserves an in-flight restore', async () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const controls = options();
    const { result } = renderHook(() => useUndoDelete(controls));
    await act(async () => { await result.current.deleteItem(item.id); });
    hidden.mockReturnValue(true);
    act(() => fireEvent(document, new Event('visibilitychange')));
    expect(result.current.deleted).toBeNull();

    hidden.mockReturnValue(false);
    let finishRestore!: (saved: boolean) => void;
    controls.restore.mockImplementation(() => new Promise<boolean>((resolve) => { finishRestore = resolve; }));
    await act(async () => { await result.current.deleteItem(item.id); });
    let pendingUndo!: Promise<boolean>;
    act(() => { pendingUndo = result.current.undo(); });
    hidden.mockReturnValue(true);
    act(() => fireEvent(document, new Event('visibilitychange')));
    expect(result.current.deleted).not.toBeNull();
    await act(async () => { finishRestore(true); await pendingUndo; });
    expect(result.current.deleted).toBeNull();
  });

  it('keeps failed restoration retryable until the deadline', async () => {
    const controls = options();
    controls.restore.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useUndoDelete(controls));
    await act(async () => { await result.current.deleteItem(item.id); });
    await act(async () => { expect(await result.current.undo()).toBe(false); });
    expect(result.current.error).toContain('Try Undo again');
    await act(async () => { expect(await result.current.undo()).toBe(true); });
    expect(result.current.deleted).toBeNull();
    expect(controls.restore).toHaveBeenCalledTimes(2);
  });
});
