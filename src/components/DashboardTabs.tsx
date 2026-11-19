'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { FiBell, FiBookmark, FiBriefcase, FiHome } from 'react-icons/fi';
import { cx } from './ui/Card';
import { useUserDataContext } from './UserDataProvider';

export type TabId = 'dashboard' | 'portfolio' | 'watchlist' | 'alerts';

export const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiHome aria-hidden="true" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <FiBriefcase aria-hidden="true" /> },
  { id: 'watchlist', label: 'Watchlist', icon: <FiBookmark aria-hidden="true" /> },
  { id: 'alerts', label: 'Alerts', icon: <FiBell aria-hidden="true" /> },
];

const tabPanelSkeleton = () => (
  <div className="h-64 rounded-xl bg-slate-800/60" aria-hidden="true" />
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

const PANELS: Record<TabId, React.ComponentType> = {
  dashboard: DashboardPanel,
  portfolio: PortfolioManagement,
  watchlist: Watchlist,
  alerts: MarketAlerts,
};

function isTabId(value: string | null): value is TabId {
  return value !== null && TABS.some((tab) => tab.id === value);
}

export default function DashboardTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab');
  const activeTab: TabId = isTabId(requested) ? requested : 'dashboard';
  const { mode } = useUserDataContext();
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());
  const [visitedTabs, setVisitedTabs] = useState<TabId[]>([]);
  const mountedTabs = new Set([...visitedTabs, activeTab]);

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

  function activateTab(tab: TabId) {
    setVisitedTabs((current) => current.includes(tab) ? current : [...current, tab]);
    selectTab(tab);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    activateTab(nextTab.id);
    tabRefs.current.get(nextTab.id)?.focus();
  }

  return (
    <div className="space-y-6">
      {mode === 'cloud' && (
        <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Cloud account · Portfolio, watchlist, and alerts are saved privately to your account.
        </p>
      )}
      <nav aria-label="Dashboard sections">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto border-b border-slate-700/70 pb-px"
        >
          {TABS.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  if (element) tabRefs.current.set(tab.id, element);
                  else tabRefs.current.delete(tab.id);
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => activateTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                onMouseEnter={() => {
                  if (tab.id !== 'dashboard') void PRELOADERS[tab.id]();
                }}
                onFocus={() => {
                  if (tab.id !== 'dashboard') void PRELOADERS[tab.id]();
                }}
                className={cx(
                  'inline-flex min-h-12 flex-1 flex-col items-center justify-center gap-1 whitespace-nowrap border-b px-1 py-2 text-xs font-medium transition-colors motion-reduce:transition-none sm:min-h-11 sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                  selected
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {TABS.map(({ id }) => {
        const Panel = PANELS[id];
        return (
          <div
            key={id}
            role="tabpanel"
            id={`panel-${id}`}
            aria-labelledby={`tab-${id}`}
            hidden={activeTab !== id}
            tabIndex={0}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900"
          >
            {mountedTabs.has(id) && <Panel />}
          </div>
        );
      })}
    </div>
  );
}
