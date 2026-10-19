import type { PortfolioHolding } from '@/types';

export interface PortfolioRow extends PortfolioHolding {
  currentPrice: number;
  invested: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioStats {
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
}

/**
 * Values each holding at the latest quote, falling back to the purchase price
 * when a quote is missing so a network hiccup never shows a fake loss.
 */
export function computeRows(
  holdings: readonly PortfolioHolding[],
  prices: ReadonlyMap<string, number>
): PortfolioRow[] {
  return holdings.map((holding) => {
    const currentPrice = prices.get(holding.cryptoId) ?? holding.purchasePrice;
    const invested = holding.quantity * holding.purchasePrice;
    const value = holding.quantity * currentPrice;
    const gainLoss = value - invested;
    return {
      ...holding,
      currentPrice,
      invested,
      value,
      gainLoss,
      gainLossPercent: invested > 0 ? (gainLoss / invested) * 100 : 0,
    };
  });
}

export function computeStats(rows: readonly PortfolioRow[]): PortfolioStats {
  const totalInvestment = rows.reduce((sum, row) => sum + row.invested, 0);
  const currentValue = rows.reduce((sum, row) => sum + row.value, 0);
  const totalReturn = currentValue - totalInvestment;
  return {
    totalInvestment,
    currentValue,
    totalReturn,
    returnPercentage: totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0,
  };
}

/** Holdings sorted by current value, each with its share of the portfolio. */
export function computeAllocation(rows: readonly PortfolioRow[], currentValue: number) {
  return [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row) => ({ ...row, share: currentValue > 0 ? (row.value / currentValue) * 100 : 0 }));
}
