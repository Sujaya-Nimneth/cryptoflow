'use client';

import { useEffect, useRef, useState } from 'react';

export function useExpandedForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      formRef.current?.querySelector<HTMLElement>('select, input:not([type="hidden"]), textarea')?.focus();
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  function openForm() {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
  }

  function toggleForm() {
    if (open) closeForm();
    else openForm();
  }

  return { open, formRef, openForm, closeForm, toggleForm };
}
