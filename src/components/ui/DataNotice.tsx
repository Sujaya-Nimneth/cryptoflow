import { Button } from './Button';

export function DataNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">
      <span>{message}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function FreshnessLabel({ updatedAt, stale }: { updatedAt?: number; stale: boolean }) {
  if (!updatedAt) return <span>Waiting for the first successful quote</span>;
  return (
    <span>
      {stale ? 'Stale quotes · ' : ''}
      Updated <time dateTime={new Date(updatedAt).toISOString()}>
        {new Date(updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </time>
    </span>
  );
}
