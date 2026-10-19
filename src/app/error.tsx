'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="text-sm text-slate-400">
        The dashboard failed to render. This is usually a temporary data-fetching problem.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        Try again
      </button>
    </div>
  );
}
