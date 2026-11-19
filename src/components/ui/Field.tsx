import { createContext, useContext, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx } from './Card';

const FieldControlContext = createContext<{ describedBy?: string; invalid: boolean }>({ invalid: false });

const FIELD_BASE =
  'min-h-11 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-base text-white placeholder:text-slate-400 ' +
  'focus-visible:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ' +
  'aria-invalid:border-rose-400 sm:text-sm';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <FieldControlContext.Provider value={{ describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldControlContext.Provider>
      {hint && <p id={hintId} className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p id={errorId} className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const field = useContext(FieldControlContext);
  return (
    <input
      className={cx(FIELD_BASE, className)}
      {...rest}
      aria-invalid={rest['aria-invalid'] ?? (field.invalid || undefined)}
      aria-describedby={cx(field.describedBy, rest['aria-describedby']) || undefined}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const field = useContext(FieldControlContext);
  return (
    <select
      className={cx(FIELD_BASE, className)}
      {...rest}
      aria-invalid={rest['aria-invalid'] ?? (field.invalid || undefined)}
      aria-describedby={cx(field.describedBy, rest['aria-describedby']) || undefined}
    >
      {children}
    </select>
  );
}
