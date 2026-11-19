'use client';

import { useMemo, useState } from 'react';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatCompactCurrency, formatPercent, formatPrice, trendClass } from '@/lib/format';
import type { Cryptocurrency } from '@/types';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { CoinAvatar } from './ui/CoinAvatar';
import { EmptyState } from './ui/EmptyState';
import { Field, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';
import { DataNotice, FreshnessLabel } from './ui/DataNotice';
import { useWatchlistData } from '@/hooks/useWatchlistData';
import { useUndoDelete } from '@/hooks/useUndoDelete';
import { UndoNotice } from './ui/UndoNotice';

export default function Watchlist() {
  const { entries, status, pending, error: storageError, addEntry, deleteEntry, resetInvalid } = useWatchlistData();
  const [pendingCoin, setPendingCoin] = useState('');
  const undoDelete = useUndoDelete({
    items: entries,
    remove: deleteEntry,
    restore: addEntry,
    describe: (entry) => `${coinLabel(entry.cryptoId)} from your watchlist`,
  });

  const ids = useMemo(() => [...new Set(entries.map((entry) => entry.cryptoId))], [entries]);
  const { coins, loading, error, updatedAt, freshness, refresh } = useMarketCoins(ids);

  const availableCoins = useMemo(() => {
    const tracked = new Set(entries.map((entry) => entry.cryptoId));
    return COINS.filter((coin) => !tracked.has(coin.id));
  }, [entries]);

  const quotedCount = ids.filter((id) => coins.has(id)).length;

  async function addCoin() {
    const cryptoId = pendingCoin || availableCoins[0]?.id;
    if (!cryptoId) return;
    const saved = await addEntry({ id: crypto.randomUUID(), cryptoId });
    if (!saved) return;
    setPendingCoin('');
  }

  return (
    <div className="space-y-5">
      {undoDelete.deleted && (
        <UndoNotice
          label={undoDelete.deleted.label}
          pending={undoDelete.pending}
          error={undoDelete.error}
          undoRef={undoDelete.undoRef}
          onUndo={() => void undoDelete.undo()}
          onDismiss={undoDelete.dismiss}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Watchlist</h2>
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
          <Button onClick={addCoin} disabled={availableCoins.length === 0 || status !== 'ready' || pending} className="mb-0.5">
            <FiStar aria-hidden="true" /> Add
          </Button>
        </div>
      </div>

      {status === 'invalid' && <div role="alert"><DataNotice message="Saved watchlist data is invalid and was not overwritten." /><Button variant="secondary" size="sm" onClick={resetInvalid}>Reset invalid watchlist data</Button></div>}
      {status === 'unavailable' && <DataNotice message="Browser storage is unavailable. Changes cannot be saved on this device." />}
      {storageError && <DataNotice message={storageError} />}
      {error && <DataNotice message={error} onRetry={() => void refresh()} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        <Card className="lg:col-span-2">
          <CardHeader
            title="My watchlist"
            subtitle={loading ? 'Syncing live prices…' : <FreshnessLabel updatedAt={updatedAt} stale={freshness === 'stale'} />}
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
                  <tr className="border-y border-slate-700 text-left text-xs text-slate-400">
                    <th scope="col" className="px-3 py-3 font-medium sm:px-5">Coin</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium sm:px-5">Price</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium sm:px-5">24h</th>
                    <th scope="col" className="hidden px-3 py-3 text-right font-medium sm:px-5 sm:table-cell">
                      Market cap
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-medium sm:px-5">
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
                            <CoinAvatar src={coin?.image} name={coinLabel(entry.cryptoId)} size={28} />
                            <div>
                              <p className="font-semibold text-white">{coinLabel(entry.cryptoId)}</p>
                              <p className="text-xs text-slate-400">{coinSymbol(entry.cryptoId)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-white sm:px-5">
                          {coin ? formatPrice(coin.current_price) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums sm:px-5 ${coin ? trendClass(coin.price_change_percentage_24h) : 'text-slate-400'}`}>
                          {coin ? formatPercent(coin.price_change_percentage_24h) : '—'}
                        </td>
                        <td className="hidden px-3 py-3 text-right tabular-nums text-slate-300 sm:px-5 sm:table-cell">
                          {coin ? formatCompactCurrency(coin.market_cap) : '—'}
                        </td>
                        <td className="px-3 py-3 text-right sm:px-5">
                          <IconButton
                            label={`Remove ${coinLabel(entry.cryptoId)} from watchlist`}
                            variant="danger"
                            disabled={pending || undoDelete.pending || undoDelete.deleted !== null}
                            onClick={() => void undoDelete.deleteItem(entry.id)}
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
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Tracked assets" value={entries.length} />
            <StatTile
              label="Quote coverage"
              value={`${quotedCount} / ${entries.length}`}
              hint={quotedCount === entries.length ? 'All tracked coins have quotes' : 'Tracked coins with an available quote'}
            />
          </div>
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
              <CoinAvatar src={mover.image} name={mover.name} size={22} />
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
