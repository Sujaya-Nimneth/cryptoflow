import type { ReactNode } from 'react';
import { cx } from './Card';

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative';
}

const TONES = {
  neutral: 'border-slate-700/70 bg-slate-800/60 text-white',
  positive: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  negative: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
};

export function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
  return (
    <div className={cx('rounded-xl border p-4', TONES[tone])}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
