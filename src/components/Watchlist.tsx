'use client';

import { useMemo, useState } from 'react';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatCompactCurrency, formatPercent, formatPrice, trendClass } from '@/lib/format';
import type { Cryptocurrency, WatchlistEntry } from '@/types';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { CoinAvatar } from './ui/CoinAvatar';
import { EmptyState } from './ui/EmptyState';
import { Field, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';

const SEED_WATCHLIST: WatchlistEntry[] = [
  { id: 'w-btc', cryptoId: 'bitcoin' },
  { id: 'w-eth', cryptoId: 'ethereum' },
  { id: 'w-ada', cryptoId: 'cardano' },
];

export default function Watchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>(SEED_WATCHLIST);
  const [pendingCoin, setPendingCoin] = useState('');

  const ids = useMemo(() => [...new Set(entries.map((entry) => entry.cryptoId))], [entries]);
  const { coins, loading, error } = useMarketCoins(ids);

  const availableCoins = useMemo(() => {
    const tracked = new Set(entries.map((entry) => entry.cryptoId));
    return COINS.filter((coin) => !tracked.has(coin.id));
  }, [entries]);

  const combinedPrice = useMemo(
    () => ids.reduce((sum, id) => sum + (coins.get(id)?.current_price ?? 0), 0),
    [ids, coins]
  );

  function addCoin() {
    const cryptoId = pendingCoin || availableCoins[0]?.id;
    if (!cryptoId) return;
    setEntries((current) => [...current, { id: `${cryptoId}-${Date.now()}`, cryptoId }]);
    setPendingCoin('');
  }

  function removeCoin(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Watchlist</h2>
          <p className="text-sm text-slate-400">Track the coins you care about</p>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Add coin" htmlFor="watchlist-coin">
            <Select
              id="watchlist-coin"
              value={pendingCoin || availableCoins[0]?.id || ''}
              onChange={(event) => setPendingCoin(event.target.value)}
              disabled={availableCoins.length === 0}
              className="min-w-44"
            >
              {availableCoins.length === 0 ? (
                <option value="">All coins tracked</option>
              ) : (
                availableCoins.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.name} ({coin.symbol})
                  </option>
                ))
              )}
            </Select>
          </Field>
          <Button onClick={addCoin} disabled={availableCoins.length === 0} className="mb-0.5">
            <FiStar aria-hidden="true" /> Add
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="My watchlist"
            subtitle={loading ? 'Syncing live prices…' : `${entries.length} assets tracked`}
          />
          {entries.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FiStar size={24} />}
                title="Your watchlist is empty"
                description="Add a coin above to start following its price."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <caption className="sr-only">Tracked cryptocurrencies</caption>
                <thead>
                  <tr className="border-y border-slate-700 bg-slate-900/40 text-left">
                    <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">Coin</th>
                    <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">Price</th>
                    <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">24h</th>
                    <th scope="col" className="hidden px-3 py-3 sm:px-5 font-semibold text-slate-200 sm:table-cell">
                      Market cap
                    </th>
                    <th scope="col" className="px-3 py-3 sm:px-5 text-center font-semibold text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const coin = coins.get(entry.cryptoId);
                    return (
                      <tr key={entry.id} className="border-b border-slate-700/60 last:border-0">
                        <td className="px-3 py-3 sm:px-5">
                          <div className="flex items-center gap-3">
                            <CoinAvatar src={coin?.image} alt={coinLabel(entry.cryptoId)} size={28} />
                            <div>
                              <p className="font-semibold text-white">{coinLabel(entry.cryptoId)}</p>
                              <p className="text-xs text-slate-400">{coinSymbol(entry.cryptoId)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-5 tabular-nums text-white">
                          {coin ? formatPrice(coin.current_price) : <span className="text-slate-500">—</span>}
                        </td>
                        <td className={`px-3 py-3 sm:px-5 tabular-nums ${coin ? trendClass(coin.price_change_percentage_24h) : 'text-slate-500'}`}>
                          {coin ? formatPercent(coin.price_change_percentage_24h) : '—'}
                        </td>
                        <td className="hidden px-3 py-3 sm:px-5 tabular-nums text-slate-300 sm:table-cell">
                          {coin ? formatCompactCurrency(coin.market_cap) : '—'}
                        </td>
                        <td className="px-3 py-3 sm:px-5 text-center">
                          <IconButton
                            label={`Remove ${coinLabel(entry.cryptoId)} from watchlist`}
                            variant="danger"
                            onClick={() => removeCoin(entry.id)}
                          >
                            <FiTrash2 size={16} aria-hidden="true" />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <StatTile label="Tracked assets" value={entries.length} />
          <StatTile
            label="Combined price"
            value={formatCompactCurrency(combinedPrice)}
            hint="Sum of latest prices (not market cap)"
          />
          <TopMovers ids={ids} coins={coins} />
        </div>
      </div>
    </div>
  );
}

function TopMovers({
  ids,
  coins,
}: {
  ids: string[];
  coins: Map<string, Cryptocurrency>;
}) {
  const movers = useMemo(
    () =>
      ids
        .map((id) => coins.get(id))
        .filter((coin): coin is Cryptocurrency => Boolean(coin))
        .sort((a, b) => b.current_price - a.current_price)
        .slice(0, 3),
    [ids, coins]
  );

  return (
    <Card>
      <CardHeader title="Highest priced" subtitle="Among your tracked coins" />
      <ul className="space-y-2 p-5">
        {movers.length === 0 && <li className="text-sm text-slate-400">Nothing tracked yet.</li>}
        {movers.map((mover, index) => (
          <li
            key={mover.id}
            className="flex items-center justify-between rounded-lg bg-slate-900/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400">#{index + 1}</span>
              <CoinAvatar src={mover.image} alt={mover.name} size={22} />
              <div>
                <p className="text-sm font-semibold text-white">{mover.symbol.toUpperCase()}</p>
                <p className="text-xs text-slate-400">{mover.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-white">
                {formatPrice(mover.current_price)}
              </p>
              <p className={`text-xs tabular-nums ${trendClass(mover.price_change_percentage_24h)}`}>
                {formatPercent(mover.price_change_percentage_24h)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
