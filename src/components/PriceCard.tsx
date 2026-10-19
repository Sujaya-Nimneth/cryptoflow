import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import type { Cryptocurrency } from '@/types';
import { formatCompactCurrency, formatPercent, formatPrice, trendBgClass, trendClass } from '@/lib/format';
import { CoinAvatar } from './ui/CoinAvatar';
import { cx } from './ui/Card';

interface PriceCardProps {
  crypto: Cryptocurrency;
}

export default function PriceCard({ crypto }: PriceCardProps) {
  const change = crypto.price_change_percentage_24h;
  const isUp = change >= 0;

  return (
    <article className="group rounded-xl border border-slate-700/70 bg-slate-800/60 p-4 transition hover:border-orange-500/70 hover:bg-slate-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CoinAvatar src={crypto.image} alt={crypto.name} size={32} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">{crypto.name}</h3>
            <p className="text-xs uppercase text-slate-400">{crypto.symbol}</p>
          </div>
        </div>
        <span className="shrink-0 rounded bg-slate-700/70 px-2 py-1 text-xs text-slate-300">
          #{crypto.market_cap_rank}
        </span>
      </div>

      <p className="text-xs text-slate-400">Current price</p>
      <p className="text-2xl font-bold tabular-nums text-white">{formatPrice(crypto.current_price)}</p>

      <div className={cx('mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5', trendBgClass(change))}>
        {isUp ? (
          <FiTrendingUp className="text-emerald-400" aria-hidden="true" />
        ) : (
          <FiTrendingDown className="text-rose-400" aria-hidden="true" />
        )}
        <span className={cx('font-semibold tabular-nums', trendClass(change))}>
          {formatPercent(change)}
        </span>
        <span className="text-xs text-slate-400">24h</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">24h high</dt>
          <dd className="font-semibold tabular-nums text-white">{formatPrice(crypto.high_24h)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">24h low</dt>
          <dd className="font-semibold tabular-nums text-white">{formatPrice(crypto.low_24h)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-400">Market cap</dt>
          <dd className="font-semibold tabular-nums text-white">
            {formatCompactCurrency(crypto.market_cap)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
