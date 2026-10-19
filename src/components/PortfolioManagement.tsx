'use client';

import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatPercent, formatPrice, formatQuantity, formatSignedPrice } from '@/lib/format';
import type { PortfolioHolding } from '@/types';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Field, Input, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';

const SEED_HOLDINGS: PortfolioHolding[] = [
  { id: 'seed-btc', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 },
  { id: 'seed-eth', cryptoId: 'ethereum', quantity: 5, purchasePrice: 2000 },
];

interface DraftHolding {
  cryptoId: string;
  quantity: string;
  purchasePrice: string;
}

const EMPTY_DRAFT: DraftHolding = { cryptoId: COINS[0].id, quantity: '', purchasePrice: '' };

export default function PortfolioManagement() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(SEED_HOLDINGS);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftHolding>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const ids = useMemo(() => [...new Set(holdings.map((h) => h.cryptoId))], [holdings]);
  const { prices, loading } = useMarketPrices(ids);

  const rows = useMemo(
    () =>
      holdings.map((holding) => {
        const currentPrice = prices.get(holding.cryptoId) ?? holding.purchasePrice;
        const invested = holding.quantity * holding.purchasePrice;
        const value = holding.quantity * currentPrice;
        const gainLoss = value - invested;
        const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;
        return { ...holding, currentPrice, invested, value, gainLoss, gainLossPercent };
      }),
    [holdings, prices]
  );

  const stats = useMemo(() => {
    const totalInvestment = rows.reduce((sum, row) => sum + row.invested, 0);
    const currentValue = rows.reduce((sum, row) => sum + row.value, 0);
    const totalReturn = currentValue - totalInvestment;
    return {
      totalInvestment,
      currentValue,
      totalReturn,
      returnPercentage: totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0,
    };
  }, [rows]);

  const allocation = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.value - a.value)
        .map((row) => ({
          ...row,
          share: stats.currentValue > 0 ? (row.value / stats.currentValue) * 100 : 0,
        })),
    [rows, stats.currentValue]
  );

  const isProfit = stats.totalReturn >= 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setHoldings((current) => [
      ...current,
      {
        id: `${draft.cryptoId}-${Date.now()}`,
        cryptoId: draft.cryptoId,
        quantity,
        purchasePrice,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setHoldings((current) => current.filter((holding) => holding.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Portfolio management</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Syncing live prices…' : 'Valued at the latest market prices'}
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>
          <FiPlus aria-hidden="true" /> Add asset
        </Button>
      </div>

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
              <Button type="submit">Save asset</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile label="Total investment" value={formatPrice(stats.totalInvestment)} />
        <StatTile label="Current value" value={formatPrice(stats.currentValue)} />
        <StatTile
          label="Total return"
          value={formatSignedPrice(stats.totalReturn)}
          tone={isProfit ? 'positive' : 'negative'}
        />
        <StatTile
          label="Return"
          value={formatPercent(stats.returnPercentage)}
          tone={isProfit ? 'positive' : 'negative'}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No assets yet"
            description="Add your first purchase to start tracking performance."
            action={<Button onClick={() => setShowForm(true)}>Add asset</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Portfolio holdings and performance</caption>
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/40 text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Asset</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Quantity</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Purchase</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Current</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Value</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-200">Gain / loss</th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isGain = row.gainLoss >= 0;
                  return (
                    <tr key={row.id} className="border-b border-slate-700/60 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{coinLabel(row.cryptoId)}</p>
                        <p className="text-xs text-slate-400">{coinSymbol(row.cryptoId)}</p>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-200">
                        {formatQuantity(row.quantity)}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-200">
                        {formatPrice(row.purchasePrice)}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-200">
                        {formatPrice(row.currentPrice)}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-white">{formatPrice(row.value)}</td>
                      <td
                        className={`px-5 py-3 tabular-nums ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        <p className="font-semibold">{formatSignedPrice(row.gainLoss)}</p>
                        <p className="text-xs">{formatPercent(row.gainLossPercent)}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <IconButton
                          label={`Remove ${coinLabel(row.cryptoId)}`}
                          variant="danger"
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
            <CardHeader title="Allocation" subtitle="Share of current portfolio value" />
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
            <CardHeader title="Top holdings" subtitle="Ranked by current value" />
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
                    {formatPrice(row.value)}
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
