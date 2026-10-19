'use client';

import { useEffect, useState } from 'react';

/** Renders the current time only after mount so prerendered HTML never contains a stale clock. */
export function LastUpdated() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="text-right">
      <p className="text-xs text-slate-400">Local time</p>
      <p className="font-semibold tabular-nums text-white" suppressHydrationWarning>
        {now
          ? now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })
          : '—:—:—'}
      </p>
    </div>
  );
}
