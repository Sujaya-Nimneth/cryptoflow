import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PortfolioManagement from './PortfolioManagement';

const portfolio = vi.hoisted(() => ({
  addHolding: vi.fn(),
  deleteHolding: vi.fn(),
}));

vi.mock('@/hooks/usePortfolioData', () => ({
  usePortfolioData: () => ({
    holdings: [],
    status: 'ready',
    pending: false,
    error: null,
    addHolding: portfolio.addHolding,
    deleteHolding: portfolio.deleteHolding,
    resetInvalid: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMarketCoins', () => ({
  useMarketCoins: () => ({
    coins: new Map(),
    loading: false,
    error: null,
    updatedAt: undefined,
    freshness: 'live',
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('portfolio form accessibility', () => {
  it('focuses the first control on open and returns focus on cancel', async () => {
    render(<PortfolioManagement />);
    const opener = screen.getAllByRole('button', { name: 'Add asset' })[0];
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() => expect(screen.getByLabelText('Coin')).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('links inline errors to controls and focuses the first invalid amount', async () => {
    render(<PortfolioManagement />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Add asset' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

    const quantity = await screen.findByLabelText('Quantity');
    const price = screen.getByLabelText('Purchase price (USD)');
    expect(quantity).toHaveFocus();
    expect(quantity).toHaveAttribute('aria-invalid', 'true');
    expect(quantity).toHaveAccessibleDescription('Enter a quantity.');
    expect(price).toHaveAttribute('aria-invalid', 'true');
    expect(price).toHaveAccessibleDescription('Enter a purchase price.');
    expect(portfolio.addHolding).not.toHaveBeenCalled();

    fireEvent.change(quantity, { target: { value: '0.5' } });
    expect(quantity).not.toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(price, { target: { value: '1000000000001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));
    expect(price).toHaveFocus();
    expect(price).toHaveAccessibleDescription('Purchase price must not exceed $1 trillion.');
    expect(portfolio.addHolding).not.toHaveBeenCalled();
  });

  it('saves a valid holding and restores focus to the opener', async () => {
    portfolio.addHolding.mockResolvedValue(true);
    render(<PortfolioManagement />);
    const opener = screen.getAllByRole('button', { name: 'Add asset' })[0];
    opener.focus();
    fireEvent.click(opener);
    fireEvent.change(await screen.findByLabelText('Quantity'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('Purchase price (USD)'), { target: { value: '40000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));
    await waitFor(() => expect(portfolio.addHolding).toHaveBeenCalledWith(expect.objectContaining({
      cryptoId: 'bitcoin',
      quantity: 0.5,
      purchasePrice: 40000,
    })));
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.getAllByRole('button', { name: 'Add asset' })[0]).toHaveAttribute('aria-expanded', 'false');
  });
});
