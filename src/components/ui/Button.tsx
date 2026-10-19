import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './Card';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  // orange-700 on white text reaches 5.18:1 (AA); orange-500 only reaches 2.8:1.
  primary:
    'bg-orange-700 text-white hover:bg-orange-600 active:bg-orange-800 border border-orange-600/60',
  secondary:
    'bg-slate-700/70 text-slate-100 hover:bg-slate-700 border border-slate-600/70',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-700/70 hover:text-white border border-transparent',
  danger:
    'bg-transparent text-rose-300 hover:bg-rose-500/15 border border-transparent',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: Variant;
}

export function IconButton({ label, children, variant = 'ghost', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400',
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
