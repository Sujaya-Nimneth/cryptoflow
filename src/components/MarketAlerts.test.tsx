import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarketAlerts from './MarketAlerts';

const collection = vi.hoisted(() => ({
  addAlert: vi.fn(),
  deleteAlert: vi.fn(),
  alerts: [] as Array<{
    id: string;
    cryptoId: string;
    direction: 'above' | 'below';
    targetPrice: number;
    createdAt: string;
  }>,
}));

vi.mock('@/hooks/useAlertsData', () => ({
  useAlertsData: () => ({
    alerts: collection.alerts,
    status: 'ready',
    pending: false,
    error: null,
    addAlert: collection.addAlert,
    deleteAlert: collection.deleteAlert,
    resetInvalid: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMarketCoins', () => ({
  useMarketCoins: () => ({
    coins: new Map(),
    loading: false,
    error: null,
    updatedAt: Date.now(),
    freshness: 'live',
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  collection.alerts = [];
});

describe('honest, accessible price alerts', () => {
  it('does not offer delivery channels that are not implemented', () => {
    render(<MarketAlerts />);
    expect(screen.queryByText('Notification settings')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Email, push, SMS, and background delivery are not connected/)).toBeVisible();
    expect(screen.getByText('No targets are being checked.')).toBeVisible();
  });

  it('focuses and describes an invalid target without saving', async () => {
    render(<MarketAlerts />);
    fireEvent.click(screen.getAllByRole('button', { name: 'New alert' })[0]);
    fireEvent.submit(document.querySelector('form')!);
    const target = await screen.findByLabelText('Target price (USD)');
    expect(target).toHaveFocus();
    expect(target).toHaveAccessibleDescription('Enter a target price.');
    expect(target).toHaveAttribute('aria-invalid', 'true');
    expect(collection.addAlert).not.toHaveBeenCalled();
  });

  it('returns focus to the trigger after closing the form', async () => {
    render(<MarketAlerts />);
    const opener = screen.getAllByRole('button', { name: 'New alert' })[0];
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() => expect(screen.getByLabelText('Coin')).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('states that active checks stop when the dashboard closes', () => {
    collection.alerts = [{
      id: '00000000-0000-4000-8000-000000000001',
      cryptoId: 'bitcoin',
      direction: 'above',
      targetPrice: 70000,
      createdAt: '2026-11-19T12:00:00.000Z',
    }];
    render(<MarketAlerts />);
    expect(screen.getByText(/Closing it stops checks/)).toBeVisible();
    expect(within(screen.getByRole('list')).getByText('Bitcoin')).toBeVisible();
  });
});
