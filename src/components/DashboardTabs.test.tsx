import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardTabs, { TABS } from './DashboardTabs';

const navigation = vi.hoisted(() => ({
  query: '',
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    let Panel: React.ComponentType = () => null;
    void loader().then((module) => { Panel = module.default; });
    return () => <Panel />;
  },
}));

vi.mock('./DashboardPanel', () => ({ default: () => <p>Market dashboard</p> }));
vi.mock('./PortfolioManagement', () => ({ default: () => <p>Portfolio holdings</p> }));
vi.mock('./Watchlist', () => ({ default: () => <p>Tracked coins</p> }));
vi.mock('./MarketAlerts', () => ({ default: () => <p>Price alerts</p> }));

afterEach(() => {
  cleanup();
  navigation.query = '';
  navigation.replace.mockClear();
});

describe('dashboard keyboard navigation', () => {
  it('keeps every section label and panel reference available', () => {
    render(<DashboardTabs />);
    const tablist = screen.getByRole('tablist', { name: 'Dashboard sections' });
    for (const tab of TABS) {
      const control = within(tablist).getByRole('tab', { name: tab.label });
      const panelId = control.getAttribute('aria-controls');
      expect(panelId).toBe(`panel-${tab.id}`);
      expect(document.getElementById(panelId!)).toHaveAttribute('role', 'tabpanel');
      expect(control).toHaveTextContent(tab.label);
    }
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Portfolio' })).toHaveAttribute('tabindex', '-1');
    expect(document.getElementById('panel-portfolio')).toHaveAttribute('hidden');
  });

  it.each([
    ['ArrowRight', '/?tab=portfolio', 'Portfolio'],
    ['ArrowLeft', '/?tab=alerts', 'Alerts'],
    ['End', '/?tab=alerts', 'Alerts'],
  ])('moves selection and focus with %s', (key, path, label) => {
    render(<DashboardTabs />);
    const dashboard = screen.getByRole('tab', { name: 'Dashboard' });
    dashboard.focus();
    fireEvent.keyDown(dashboard, { key });
    expect(navigation.replace).toHaveBeenCalledWith(path, { scroll: false });
    expect(screen.getByRole('tab', { name: label })).toHaveFocus();
  });

  it('wraps forward navigation and returns Home to the dashboard', () => {
    navigation.query = 'tab=alerts';
    render(<DashboardTabs />);
    const alerts = screen.getByRole('tab', { name: 'Alerts' });
    alerts.focus();
    fireEvent.keyDown(alerts, { key: 'ArrowRight' });
    expect(navigation.replace).toHaveBeenCalledWith('/', { scroll: false });
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Dashboard' }), { key: 'End' });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Alerts' }), { key: 'Home' });
    expect(navigation.replace).toHaveBeenLastCalledWith('/', { scroll: false });
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveFocus();
  });
});
