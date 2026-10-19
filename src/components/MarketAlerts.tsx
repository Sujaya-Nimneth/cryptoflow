'use client';

import { useMemo, useState } from 'react';
import { FiBell, FiTrash2, FiX } from 'react-icons/fi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatPrice } from '@/lib/format';
import type { PriceAlert } from '@/types';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Field, Input, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';

interface DraftAlert {
  cryptoId: string;
  direction: 'above' | 'below';
  targetPrice: string;
}

const EMPTY_DRAFT: DraftAlert = { cryptoId: 'bitcoin', direction: 'above', targetPrice: '' };

export default function MarketAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftAlert>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const ids = useMemo(() => [...new Set(alerts.map((alert) => alert.cryptoId))], [alerts]);
  const { coins, loading } = useMarketCoins(ids);

  const evaluated = useMemo(
    () =>
      alerts.map((alert) => {
        const currentPrice = coins.get(alert.cryptoId)?.current_price;
        const triggered =
          currentPrice === undefined
            ? false
            : alert.direction === 'above'
              ? currentPrice >= alert.targetPrice
              : currentPrice <= alert.targetPrice;
        return { ...alert, currentPrice, triggered };
      }),
    [alerts, coins]
  );

  const triggeredCount = evaluated.filter((alert) => alert.triggered).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetPrice = Number(draft.targetPrice);

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setFormError('Enter a target price greater than zero.');
      return;
    }

    setAlerts((current) => [
      {
        id: `${draft.cryptoId}-${Date.now()}`,
        cryptoId: draft.cryptoId,
        direction: draft.direction,
        targetPrice,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(false);
  }

  function deleteAlert(id: string) {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Market alerts</h2>
          <p className="text-sm text-slate-400" aria-live="polite">
            {loading
              ? 'Checking live prices…'
              : `${triggeredCount} of ${alerts.length} alert${alerts.length === 1 ? '' : 's'} triggered`}
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>
          <FiBell aria-hidden="true" /> New alert
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader
            title="Create alert"
            action={
              <IconButton label="Close form" onClick={() => setShowForm(false)}>
                <FiX aria-hidden="true" />
              </IconButton>
            }
          />
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Coin" htmlFor="alert-coin">
                <Select
                  id="alert-coin"
                  value={draft.cryptoId}
                  onChange={(event) => setDraft({ ...draft, cryptoId: event.target.value })}
                >
                  {COINS.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Condition" htmlFor="alert-direction">
                <Select
                  id="alert-direction"
                  value={draft.direction}
                  onChange={(event) =>
                    setDraft({ ...draft, direction: event.target.value as 'above' | 'below' })
                  }
                >
                  <option value="above">Price rises above</option>
                  <option value="below">Price falls below</option>
                </Select>
              </Field>

              <Field label="Target price (USD)" htmlFor="alert-target">
                <Input
                  id="alert-target"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="50000"
                  value={draft.targetPrice}
                  onChange={(event) => setDraft({ ...draft, targetPrice: event.target.value })}
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
              <Button type="submit">Create alert</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Active alerts" value={alerts.length} />
        <StatTile
          label="Triggered"
          value={triggeredCount}
          tone={triggeredCount > 0 ? 'positive' : 'neutral'}
        />
        <StatTile label="Coins monitored" value={ids.length} />
      </div>

      {evaluated.length === 0 ? (
        <EmptyState
          icon={<FiBell size={24} />}
          title="No alerts yet"
          description="Create an alert to be notified when a coin crosses your target price."
          action={<Button onClick={() => setShowForm(true)}>Create alert</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {evaluated.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-xl border p-4 ${
                alert.triggered
                  ? 'border-orange-500/60 bg-orange-500/10'
                  : 'border-slate-700/70 bg-slate-800/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {coinLabel(alert.cryptoId)}
                      <span className="ml-2 text-slate-400">({coinSymbol(alert.cryptoId)})</span>
                    </h3>
                    {alert.triggered && (
                      <span className="rounded bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">
                        TRIGGERED
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-400">Condition</dt>
                      <dd className="font-semibold text-white">
                        Price {alert.direction === 'above' ? 'above' : 'below'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Target</dt>
                      <dd className="font-semibold tabular-nums text-white">
                        {formatPrice(alert.targetPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Current</dt>
                      <dd className="font-semibold tabular-nums text-white">
                        {alert.currentPrice === undefined ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          formatPrice(alert.currentPrice)
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <IconButton
                  label={`Delete ${coinLabel(alert.cryptoId)} alert`}
                  variant="danger"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <FiTrash2 size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader title="Notification settings" subtitle="Delivery channels for triggered alerts" />
        <div className="space-y-3 p-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-orange-600" />
            <span className="text-slate-300">Email notifications</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-orange-600" />
            <span className="text-slate-300">Browser push notifications</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-4 w-4 accent-orange-600" />
            <span className="text-slate-300">SMS notifications</span>
          </label>
          <p className="text-xs text-slate-500">
            Delivery is a placeholder — connect Supabase or an email provider to enable it.
          </p>
        </div>
      </Card>
    </div>
  );
}
