import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from './Card';

const FIELD_BASE =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 ' +
  'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_BASE, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(FIELD_BASE, className)} {...rest}>
      {children}
    </select>
  );
}
