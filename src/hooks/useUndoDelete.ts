'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const UNDO_DELETE_MS = 15_000;

interface UndoDeleteOptions<TItem extends { id: string }> {
  items: readonly TItem[];
  remove: (id: string) => Promise<boolean>;
  restore: (item: TItem) => Promise<boolean>;
  describe: (item: TItem) => string;
}

interface DeletedItem<TItem> {
  item: TItem;
  label: string;
}

export function useUndoDelete<TItem extends { id: string }>({
  items,
  remove,
  restore,
  describe,
}: UndoDeleteOptions<TItem>) {
  const [deleted, setDeleted] = useState<DeletedItem<TItem> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletedRef = useRef<DeletedItem<TItem> | null>(null);
  const inFlight = useRef(false);
  const expiresAt = useRef<number | null>(null);
  const generation = useRef(0);
  const undoRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef(items);
  const describeRef = useRef(describe);

  useEffect(() => {
    itemsRef.current = items;
    describeRef.current = describe;
  }, [describe, items]);

  useEffect(() => () => { generation.current += 1; }, []);

  const clearNotice = useCallback((restoreFocus = true) => {
    deletedRef.current = null;
    expiresAt.current = null;
    setDeleted(null);
    if (!restoreFocus) returnFocusRef.current = null;
  }, []);

  useEffect(() => {
    if (!deleted) return;
    if (document.hidden && !inFlight.current) {
      clearNotice(false);
      return;
    }
    const expires = expiresAt.current ?? Date.now() + UNDO_DELETE_MS;
    expiresAt.current = expires;
    const expire = () => {
      if (deletedRef.current && !inFlight.current) clearNotice(false);
    };
    const timeout = window.setTimeout(expire, Math.max(0, expires - Date.now()));
    const expireWhenHidden = () => {
      if (document.hidden) expire();
    };
    document.addEventListener('visibilitychange', expireWhenHidden);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', expireWhenHidden);
    };
  }, [clearNotice, deleted, pending]);

  useEffect(() => {
    if (pending) return;
    if (deleted) {
      const focused = document.activeElement;
      const focusIsInNotice = undoRef.current?.closest('section')?.contains(focused);
      const focusWasLost = !(focused instanceof HTMLElement) || focused === document.body || !focused.isConnected;
      if (!focusIsInNotice && (focusWasLost || focused instanceof HTMLButtonElement && focused.disabled)) {
        undoRef.current?.focus();
      }
      return;
    }
    if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    returnFocusRef.current = null;
  }, [deleted, pending]);

  const deleteItem = useCallback(async (id: string) => {
    if (inFlight.current || deletedRef.current) return false;
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item) return false;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused !== document.body) returnFocusRef.current = focused;
    inFlight.current = true;
    const currentGeneration = generation.current;
    setPending(true);
    setError(null);
    try {
      const saved = await remove(id);
      if (currentGeneration !== generation.current) return false;
      if (saved) {
        const notice = { item, label: describeRef.current(item) };
        deletedRef.current = notice;
        expiresAt.current = Date.now() + UNDO_DELETE_MS;
        setDeleted(notice);
      }
      return saved;
    } finally {
      inFlight.current = false;
      if (currentGeneration === generation.current) setPending(false);
    }
  }, [remove]);

  const undo = useCallback(async () => {
    const notice = deletedRef.current;
    if (!notice || inFlight.current) return false;
    if (expiresAt.current !== null && Date.now() >= expiresAt.current) {
      clearNotice(false);
      return false;
    }
    inFlight.current = true;
    const currentGeneration = generation.current;
    setPending(true);
    setError(null);
    try {
      const saved = await restore(notice.item);
      if (currentGeneration !== generation.current) return false;
      if (saved && deletedRef.current === notice) clearNotice();
      else setError(`Could not restore ${notice.label}. Try Undo again.`);
      return saved;
    } finally {
      inFlight.current = false;
      if (currentGeneration === generation.current) setPending(false);
    }
  }, [clearNotice, restore]);

  return {
    deleted,
    pending,
    error,
    undoRef,
    deleteItem,
    undo,
    dismiss: () => clearNotice(),
  };
}
