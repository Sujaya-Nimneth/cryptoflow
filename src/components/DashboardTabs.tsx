'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { FiBell, FiBookmark, FiBriefcase, FiHome } from 'react-icons/fi';
import { cx } from './ui/Card';

export type TabId = 'dashboard' | 'portfolio' | 'watchlist' | 'alerts';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiHome aria-hidden="true" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <FiBriefcase aria-hidden="true" /> },
  { id: 'watchlist', label: 'Watchlist', icon: <FiBookmark aria-hidden="true" /> },
  { id: 'alerts', label: 'Alerts', icon: <FiBell aria-hidden="true" /> },
];

const tabPanelSkeleton = () => (
  <div className="h-64 animate-pulse rounded-xl bg-slate-800/60" aria-hidden="true" />
);

// Each tab is its own chunk so Chart.js and the trading views never block first paint.
const DashboardPanel = dynamic(() => import('./DashboardPanel'), { loading: tabPanelSkeleton });
const PortfolioManagement = dynamic(() => import('./PortfolioManagement'), {
  loading: tabPanelSkeleton,
});
const Watchlist = dynamic(() => import('./Watchlist'), { loading: tabPanelSkeleton });
const MarketAlerts = dynamic(() => import('./MarketAlerts'), { loading: tabPanelSkeleton });

const PRELOADERS: Record<Exclude<TabId, 'dashboard'>, () => Promise<unknown>> = {
  portfolio: () => import('./PortfolioManagement'),
  watchlist: () => import('./Watchlist'),
  alerts: () => import('./MarketAlerts'),
};

function isTabId(value: string | null): value is TabId {
  return value !== null && TABS.some((tab) => tab.id === value);
}

export default function DashboardTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab: TabId = isTabId(requested) ? requested : 'dashboard';

  const selectTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'dashboard') params.delete('tab');
      else params.set('tab', tab);
      const query = params.toString();
      router.replace(query ? `/?${query}` : '/', { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-8">
      <nav aria-label="Dashboard sections">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto border-b border-slate-700/70 pb-px"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                aria-label={tab.label}
                onClick={() => selectTab(tab.id)}
                onMouseEnter={() => {
                  if (tab.id !== 'dashboard') void PRELOADERS[tab.id]();
                }}
                className={cx(
                  'inline-flex shrink-0 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                  selected
                    ? 'border-orange-500 text-orange-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'dashboard' && <DashboardPanel />}
        {activeTab === 'portfolio' && <PortfolioManagement />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'alerts' && <MarketAlerts />}
      </div>
    </div>
  );
}
