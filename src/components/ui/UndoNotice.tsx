'use client';

import type { Ref } from 'react';
import { FiX } from 'react-icons/fi';
import { Button, IconButton } from './Button';

interface UndoNoticeProps {
  label: string;
  pending: boolean;
  error: string | null;
  undoRef: Ref<HTMLButtonElement>;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoNotice({ label, pending, error, undoRef, onUndo, onDismiss }: UndoNoticeProps) {
  return (
    <section
      aria-label="Deleted item"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-lg border border-slate-500 bg-slate-800 p-4 shadow-lg sm:left-auto sm:right-6 sm:mx-0 sm:w-96"
    >
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="min-w-0 break-words text-sm text-slate-100">Removed {label}.</p>
        <IconButton label="Dismiss undo notice" onClick={onDismiss} disabled={pending}>
          <FiX aria-hidden="true" />
        </IconButton>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-300">Undo is available for 15 seconds while this page stays visible.</p>
        <Button ref={undoRef} variant="secondary" size="sm" onClick={onUndo} disabled={pending}>
          {pending ? 'Restoring…' : 'Undo'}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
    </section>
  );
}
