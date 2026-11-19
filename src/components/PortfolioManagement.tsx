'use client';

import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatPercent, formatPrice, formatQuantity, formatSignedPrice } from '@/lib/format';
import { computeAllocation, computeRows, computeStats } from '@/lib/portfolio';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Field, Input, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';
import { DataNotice, FreshnessLabel } from './ui/DataNotice';
import { usePortfolioData } from '@/hooks/usePortfolioData';

interface DraftHolding {
  cryptoId: string;
  quantity: string;
  purchasePrice: string;
}

const EMPTY_DRAFT: DraftHolding = { cryptoId: COINS[0].id, quantity: '', purchasePrice: '' };

export default function PortfolioManagement() {
  const { holdings, status, pending, error: storageError, addHolding, deleteHolding, resetInvalid } = usePortfolioData();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftHolding>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const ids = useMemo(() => [...new Set(holdings.map((h) => h.cryptoId))], [holdings]);
  const { coins, loading, error, updatedAt, freshness, refresh } = useMarketCoins(ids);

  const quotes = useMemo(
    () =>
      new Map(
        [...coins.entries()].flatMap(([id, coin]) => updatedAt === undefined ? [] : [[id, {
          price: coin.current_price,
          freshness: freshness === 'stale' ? 'stale' as const : 'live' as const,
          updatedAt,
        }] as const])
      ),
    [coins, freshness, updatedAt]
  );

  const rows = useMemo(() => computeRows(holdings, quotes), [holdings, quotes]);
  const stats = useMemo(() => computeStats(rows), [rows]);
  const allocation = useMemo(
    () => computeAllocation(rows, stats.partialValue),
    [rows, stats.partialValue]
  );

  const isProfit = (stats.totalReturn ?? 0) >= 0;
  const valuationMessage = stats.missingHoldings > 0
    ? `${stats.pricedHoldings} of ${rows.length} holdings have quotes. ${formatPrice(stats.partialValue)} is a partial value, not your complete portfolio value.`
    : stats.staleHoldings > 0
      ? `${stats.staleHoldings} holding${stats.staleHoldings === 1 ? '' : 's'} use stale quotes. The total is not a current valuation.`
      : 'All holdings are valued with recent market quotes.';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(draft.quantity);
    const purchasePrice = Number(draft.purchasePrice);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      setFormError('Purchase price must be greater than zero.');
      return;
    }

    const saved = await addHolding({ id: crypto.randomUUID(), cryptoId: draft.cryptoId, quantity, purchasePrice });
    if (!saved) return;
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await deleteHolding(id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Portfolio management</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Syncing live prices…' : <FreshnessLabel updatedAt={updatedAt} stale={freshness === 'stale'} />}
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)} aria-expanded={showForm} disabled={status !== 'ready' || pending}>
          <FiPlus aria-hidden="true" /> Add asset
        </Button>
      </div>

      {status === 'invalid' && <div role="alert"><DataNotice message="Saved portfolio data is invalid and was not overwritten." /><Button variant="secondary" size="sm" onClick={resetInvalid}>Reset invalid portfolio data</Button></div>}
      {status === 'unavailable' && <DataNotice message="Browser storage is unavailable. Changes cannot be saved on this device." />}
      {storageError && <DataNotice message={storageError} />}
      {error && <DataNotice message={error} onRetry={() => void refresh()} />}
      {!loading && rows.length > 0 && (
        <p role="status" className={`rounded-lg p-3 text-sm ${stats.complete && stats.staleHoldings === 0 ? 'bg-slate-800/60 text-slate-300' : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'}`}>
          {valuationMessage}
        </p>
      )}

      {showForm && (
        <Card>
          <CardHeader title="Add an asset" subtitle="Record a purchase to track its performance." />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Coin" htmlFor="asset-coin">
                <Select
                  id="asset-coin"
                  value={draft.cryptoId}
                  onChange={(e) => setDraft({ ...draft, cryptoId: e.target.value })}
                >
                  {COINS.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Quantity" htmlFor="asset-quantity">
                <Input
                  id="asset-quantity"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.5"
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                />
              </Field>

              <Field label="Purchase price (USD)" htmlFor="asset-price">
                <Input
                  id="asset-price"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="40000"
                  value={draft.purchasePrice}
                  onChange={(e) => setDraft({ ...draft, purchasePrice: e.target.value })}
                />
              </Field>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-rose-300">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save asset'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile label="Total investment" value={formatPrice(stats.totalInvestment)} />
        <StatTile
          label={stats.complete ? (stats.staleHoldings > 0 ? 'Value with stale quotes' : 'Current value') : 'Partial quoted value'}
          value={formatPrice(stats.complete ? stats.currentValue! : stats.partialValue)}
          hint={stats.complete ? undefined : `${stats.missingHoldings} holding${stats.missingHoldings === 1 ? '' : 's'} unavailable`}
        />
        <StatTile
          label="Total return"
          value={stats.totalReturn === undefined ? 'Unavailable' : formatSignedPrice(stats.totalReturn)}
          tone={stats.totalReturn === undefined ? 'neutral' : isProfit ? 'positive' : 'negative'}
        />
        <StatTile
          label="Return"
          value={stats.returnPercentage === undefined ? 'Unavailable' : formatPercent(stats.returnPercentage)}
          tone={stats.returnPercentage === undefined ? 'neutral' : isProfit ? 'positive' : 'negative'}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No assets yet"
            description="Add your first purchase to start tracking performance."
            action={<Button onClick={() => setShowForm(true)} disabled={status !== 'ready' || pending}>Add asset</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <caption className="sr-only">Portfolio holdings and performance</caption>
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40 text-left">
                  <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">Asset</th>
                  <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">Quantity</th>
                  <th scope="col" className="hidden px-3 py-3 sm:px-5 font-semibold text-slate-200 md:table-cell">
                    Purchase
                  </th>
                  <th scope="col" className="hidden px-3 py-3 sm:px-5 font-semibold text-slate-200 md:table-cell">
                    Current
                  </th>
                  <th scope="col" className="hidden px-3 py-3 sm:px-5 font-semibold text-slate-200 sm:table-cell">
                    Value
                  </th>
                  <th scope="col" className="px-3 py-3 sm:px-5 font-semibold text-slate-200">Gain / loss</th>
                  <th scope="col" className="px-3 py-3 sm:px-5 text-center font-semibold text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isGain = (row.gainLoss ?? 0) >= 0;
                  return (
                    <tr key={row.id} className="border-b border-slate-700/60 last:border-0">
                      <td className="px-3 py-3 sm:px-5">
                        <p className="font-semibold text-white">{coinLabel(row.cryptoId)}</p>
                        <p className="text-xs text-slate-400">{coinSymbol(row.cryptoId)}</p>
                      </td>
                      <td className="px-3 py-3 sm:px-5 tabular-nums text-slate-200">
                        {formatQuantity(row.quantity)}
                      </td>
                      <td className="hidden px-3 py-3 sm:px-5 tabular-nums text-slate-200 md:table-cell">
                        {formatPrice(row.purchasePrice)}
                      </td>
                      <td className="hidden px-3 py-3 sm:px-5 tabular-nums text-slate-200 md:table-cell">
                        {row.currentPrice === undefined ? 'Unavailable' : formatPrice(row.currentPrice)}
                        {row.quoteStatus === 'stale' && <span className="block text-xs text-amber-300">Stale</span>}
                      </td>
                      <td className="hidden px-3 py-3 sm:px-5 tabular-nums text-white sm:table-cell">
                        {row.value === undefined ? 'Unavailable' : formatPrice(row.value)}
                      </td>
                      <td
                        className={`px-3 py-3 sm:px-5 tabular-nums ${row.gainLoss === undefined ? 'text-slate-400' : isGain ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        <p className="font-semibold">{row.gainLoss === undefined ? 'Unavailable' : formatSignedPrice(row.gainLoss)}</p>
                        <p className="text-xs">{row.gainLossPercent === undefined ? 'No current quote' : formatPercent(row.gainLossPercent)}</p>
                      </td>
                      <td className="px-3 py-3 sm:px-5 text-center">
                        <IconButton
                          label={`Remove ${coinLabel(row.cryptoId)}`}
                          variant="danger"
                          disabled={pending}
                          onClick={() => handleDelete(row.id)}
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

      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Allocation" subtitle="Share of quoted value only; unavailable holdings are excluded" />
            <div className="space-y-3 p-5">
              {allocation.map((row) => (
                <div key={row.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{coinSymbol(row.cryptoId)}</span>
                    <span className="font-semibold tabular-nums text-white">
                      {row.share.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-700"
                    role="progressbar"
                    aria-valuenow={Math.round(row.share)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${coinSymbol(row.cryptoId)} allocation`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500"
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Top holdings" subtitle="Ranked among holdings with available quotes" />
            <ul className="space-y-2 p-5">
              {allocation.slice(0, 5).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 p-3"
                >
                  <div>
                    <p className="font-semibold text-white">{coinSymbol(row.cryptoId)}</p>
                    <p className="text-xs text-slate-400">
                      {formatQuantity(row.quantity)} units
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-orange-300">
                    {formatPrice(row.value!)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
