import { Suspense } from 'react';
import DashboardTabs from '@/components/DashboardTabs';
import { LastUpdated } from '@/components/LastUpdated';

const tabSkeleton = (
  <div className="space-y-4" aria-hidden="true">
    <div className="h-9 w-64 animate-pulse rounded bg-slate-800" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-52 animate-pulse rounded-xl bg-slate-800/70" />
      ))}
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                CryptoFlow Analytics
              </h1>
              <p className="hidden text-sm text-slate-400 sm:block">
                Real-time cryptocurrency analytics dashboard
              </p>
            </div>
            <LastUpdated />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={tabSkeleton}>
          <DashboardTabs />
        </Suspense>
      </main>

      <footer className="mt-12 border-t border-slate-700 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h2 className="mb-3 font-semibold text-white">About CryptoFlow</h2>
              <p className="text-sm text-slate-400">
                Cryptocurrency analytics with live market data, portfolio tracking, and price
                alerts. Market data is provided by CoinGecko.
              </p>
            </div>
            <div>
              <h2 className="mb-3 font-semibold text-white">Features</h2>
              <ul className="space-y-1.5 text-sm text-slate-400">
                <li>Live price tracking</li>
                <li>Portfolio management</li>
                <li>Candlestick charts</li>
                <li>Price alerts</li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 font-semibold text-white">Data sources</h2>
              <ul className="space-y-1.5 text-sm text-slate-400">
                <li>
                  <a
                    className="underline decoration-slate-600 underline-offset-4 hover:text-white"
                    href="https://www.coingecko.com/en/api"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    CoinGecko API
                  </a>
                </li>
                <li>Supabase (optional persistence)</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-700 pt-6 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CryptoFlow Analytics. Prices are informational only,
            not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
