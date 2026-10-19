'use client';

import { useMemo, useState } from 'react';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatCompactCurrency, formatPrice } from '@/lib/format';
import type { WatchlistEntry } from '@/types';
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
  const { prices, loading, error } = useMarketPrices(ids);

  const availableCoins = useMemo(() => {
    const tracked = new Set(entries.map((entry) => entry.cryptoId));
    return COINS.filter((coin) => !tracked.has(coin.id));
  }, [entries]);

  const combinedPrice = useMemo(
    () => ids.reduce((sum, id) => sum + (prices.get(id) ?? 0), 0),
    [ids, prices]
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
              <table className="w-full text-sm">
                <caption className="sr-only">Tracked cryptocurrencies</caption>
                <thead>
                  <tr className="border-y border-slate-700 bg-slate-900/40 text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Coin</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Price</th>
                    <th scope="col" className="px-5 py-3 text-center font-semibold text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const price = prices.get(entry.cryptoId);
                    return (
                      <tr key={entry.id} className="border-b border-slate-700/60 last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <CoinAvatar alt={coinLabel(entry.cryptoId)} size={28} />
                            <div>
                              <p className="font-semibold text-white">{coinLabel(entry.cryptoId)}</p>
                              <p className="text-xs text-slate-400">{coinSymbol(entry.cryptoId)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-white">
                          {price === undefined ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            formatPrice(price)
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
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
          <TopMovers ids={ids} prices={prices} />
        </div>
      </div>
    </div>
  );
}

function TopMovers({ ids, prices }: { ids: string[]; prices: Map<string, number> }) {
  const movers = useMemo(
    () =>
      ids
        .map((id) => ({ id, price: prices.get(id) ?? 0 }))
        .sort((a, b) => b.price - a.price)
        .slice(0, 3),
    [ids, prices]
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
              <div>
                <p className="text-sm font-semibold text-white">{coinSymbol(mover.id)}</p>
                <p className="text-xs text-slate-400">{coinLabel(mover.id)}</p>
              </div>
            </div>
            <p className="text-sm font-semibold tabular-nums text-white">{formatPrice(mover.price)}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
