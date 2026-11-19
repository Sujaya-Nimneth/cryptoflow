'use client';

import { useMemo, useState } from 'react';
import { FiBell, FiTrash2, FiX } from 'react-icons/fi';
import { useMarketCoins } from '@/hooks/useMarketCoins';
import { COINS, coinLabel, coinSymbol } from '@/lib/coins';
import { formatPrice } from '@/lib/format';
import { isAlertTriggered } from '@/lib/alerts';
import { firstInvalidField, positiveAmountError, type FieldErrors } from '@/lib/formValidation';
import { MAX_POSITIVE_AMOUNT } from '@/lib/userDataSchemas';
import { useExpandedForm } from '@/hooks/useExpandedForm';
import { Button, IconButton } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Field, Input, Select } from './ui/Field';
import { StatTile } from './ui/StatTile';
import { DataNotice, FreshnessLabel } from './ui/DataNotice';
import { useAlertsData } from '@/hooks/useAlertsData';
import { useUndoDelete } from '@/hooks/useUndoDelete';
import { UndoNotice } from './ui/UndoNotice';

interface DraftAlert {
  cryptoId: string;
  direction: 'above' | 'below';
  targetPrice: string;
}

const EMPTY_DRAFT: DraftAlert = { cryptoId: 'bitcoin', direction: 'above', targetPrice: '' };
const ALERT_FIELDS = ['targetPrice'] as const;

export default function MarketAlerts() {
  const { alerts, status, pending, error: storageError, addAlert, deleteAlert, resetInvalid } = useAlertsData();
  const { open: showForm, formRef, openForm, closeForm, toggleForm } = useExpandedForm();
  const [draft, setDraft] = useState<DraftAlert>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors<'targetPrice'>>({});
  const undoDelete = useUndoDelete({
    items: alerts,
    remove: deleteAlert,
    restore: addAlert,
    describe: (alert) => `${coinLabel(alert.cryptoId)} alert`,
  });

  const ids = useMemo(() => [...new Set(alerts.map((alert) => alert.cryptoId))], [alerts]);
  const { coins, loading, error, updatedAt, freshness, refresh } = useMarketCoins(ids);

  const evaluated = useMemo(
    () =>
      alerts.map((alert) => {
        const currentPrice = coins.get(alert.cryptoId)?.current_price;
        return {
          ...alert,
          currentPrice,
          triggered: isAlertTriggered(alert.direction, alert.targetPrice, currentPrice),
        };
      }),
    [alerts, coins]
  );

  const triggeredCount = evaluated.filter((alert) => alert.triggered).length;
  const checksRunning = !loading && !error && freshness !== 'stale' && updatedAt !== undefined;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = { targetPrice: positiveAmountError(draft.targetPrice, 'Target price') ?? undefined };
    setErrors(nextErrors);
    if (firstInvalidField(event.currentTarget, nextErrors, ALERT_FIELDS)) return;

    const saved = await addAlert({
      id: crypto.randomUUID(),
      cryptoId: draft.cryptoId,
      direction: draft.direction,
      targetPrice: Number(draft.targetPrice),
      createdAt: new Date().toISOString(),
    });
    if (!saved) return;
    setDraft(EMPTY_DRAFT);
    setErrors({});
    closeForm();
  }

  function updateDraft(field: keyof DraftAlert, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'targetPrice') setErrors({});
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
          <h2 className="text-xl font-semibold text-white">Market alerts</h2>
          <p className="text-sm text-slate-400">
            {loading
              ? 'Checking live prices…'
              : error
                ? 'Checks paused while price data is unavailable. Retry to resume.'
                : freshness === 'stale'
                  ? 'Checks paused because quotes are stale. Refresh prices to resume.'
                  : `${triggeredCount} of ${alerts.length} alert${alerts.length === 1 ? '' : 's'} triggered · Checks every 30 seconds while this dashboard is open`}
          </p>
          {!loading && <p className="text-xs text-slate-400"><FreshnessLabel updatedAt={updatedAt} stale={freshness === 'stale'} /></p>}
          <p className="mt-1 text-xs text-slate-400">
            Results appear only on this screen. Email, push, SMS, and background delivery are not connected.
          </p>
        </div>
        <Button onClick={toggleForm} aria-expanded={showForm} aria-controls="alert-form" disabled={status !== 'ready' || pending}>
          <FiBell aria-hidden="true" /> New alert
        </Button>
      </div>

      {status === 'invalid' && <div role="alert"><DataNotice message="Saved alert data is invalid and was not overwritten." /><Button variant="secondary" size="sm" onClick={resetInvalid}>Reset invalid alert data</Button></div>}
      {status === 'unavailable' && <DataNotice message="Browser storage is unavailable. Changes cannot be saved on this device." />}
      {storageError && <DataNotice message={storageError} />}
      {error && <DataNotice message={error} onRetry={() => void refresh()} />}

      <div id="alert-form" hidden={!showForm}>
        {showForm && (
        <Card>
          <CardHeader
            title="Create alert"
            action={
              <IconButton label="Close form" onClick={closeForm}>
                <FiX aria-hidden="true" />
              </IconButton>
            }
          />
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Coin" htmlFor="alert-coin">
                <Select
                  id="alert-coin"
                  name="cryptoId"
                  autoComplete="off"
                  required
                  value={draft.cryptoId}
                  onChange={(event) => updateDraft('cryptoId', event.target.value)}
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
                  name="direction"
                  autoComplete="off"
                  required
                  value={draft.direction}
                  onChange={(event) =>
                    updateDraft('direction', event.target.value)
                  }
                >
                  <option value="above">Price rises above</option>
                  <option value="below">Price falls below</option>
                </Select>
              </Field>

              <Field label="Target price (USD)" htmlFor="alert-target" error={errors.targetPrice}>
                <Input
                  id="alert-target"
                  name="targetPrice"
                  type="number"
                  min="0"
                  max={MAX_POSITIVE_AMOUNT}
                  step="any"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  placeholder="50000"
                  value={draft.targetPrice}
                  onChange={(event) => updateDraft('targetPrice', event.target.value)}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Create alert'}</Button>
            </div>
          </form>
        </Card>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
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
          description="Create a target to see when its price crosses your threshold while this dashboard is open."
          action={<Button onClick={openForm} aria-expanded={showForm} aria-controls="alert-form" disabled={status !== 'ready' || pending}>Create alert</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {evaluated.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-lg border p-4 ${
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
                          <span className="text-slate-400">—</span>
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
                  disabled={pending || undoDelete.pending || undoDelete.deleted !== null}
                  onClick={() => void undoDelete.deleteItem(alert.id)}
                >
                  <FiTrash2 size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="text-sm text-slate-400">
        {alerts.length === 0
          ? 'No targets are being checked.'
          : checksRunning
            ? `Checking ${alerts.length} target${alerts.length === 1 ? '' : 's'} while this dashboard stays open. Closing it stops checks.`
            : 'No checks are running. Wait for a recent quote or retry the price request.'}
      </p>
    </div>
  );
}
