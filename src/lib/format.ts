const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8,
});

/** Formats a USD amount. Sub-cent coins keep more precision instead of rounding to $0.00. */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.01) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 6,
    }).format(value);
  }
  return priceFormatter.format(value);
}

/** Formats large numbers (market cap, volume) as $2.77T style strings. */
export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `$${compactFormatter.format(value)}`;
}

/** Formats a large plain number (supply, counts). */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return compactFormatter.format(value);
}

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return quantityFormatter.format(value);
}

/** Formats a percentage with an explicit sign, e.g. "+2.50%" / "-1.20%". */
export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatSignedPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatPrice(Math.abs(value))}`;
}

/** Maps a 24h change to the semantic colour token used across the dashboard. */
export function trendClass(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-slate-400';
}

export function trendBgClass(value: number): string {
  if (value > 0) return 'bg-emerald-500/10';
  if (value < 0) return 'bg-rose-500/10';
  return 'bg-slate-500/10';
}
