import type { PortfolioHolding } from '@/types';
import type { QuoteFreshness } from './marketCache';

export interface PortfolioQuote {
  price: number;
  freshness: Exclude<QuoteFreshness, 'unavailable'>;
  updatedAt: number;
}

export interface PortfolioRow extends PortfolioHolding {
  currentPrice?: number;
  quoteStatus: QuoteFreshness;
  quoteUpdatedAt?: number;
  invested: number;
  value?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface PortfolioStats {
  totalInvestment: number;
  pricedInvestment: number;
  currentValue?: number;
  partialValue: number;
  totalReturn?: number;
  returnPercentage?: number;
  pricedHoldings: number;
  missingHoldings: number;
  staleHoldings: number;
  complete: boolean;
}

export function computeRows(
  holdings: readonly PortfolioHolding[],
  quotes: ReadonlyMap<string, PortfolioQuote>
): PortfolioRow[] {
  return holdings.map((holding) => {
    const quote = quotes.get(holding.cryptoId);
    const invested = holding.quantity * holding.purchasePrice;
    if (!quote || !Number.isFinite(quote.price) || quote.price < 0) {
      return { ...holding, quoteStatus: 'unavailable', invested };
    }
    const value = holding.quantity * quote.price;
    const gainLoss = value - invested;
    return {
      ...holding,
      currentPrice: quote.price,
      quoteStatus: quote.freshness,
      quoteUpdatedAt: quote.updatedAt,
      invested,
      value,
      gainLoss,
      gainLossPercent: invested > 0 ? (gainLoss / invested) * 100 : 0,
    };
  });
}

export function computeStats(rows: readonly PortfolioRow[]): PortfolioStats {
  const totalInvestment = rows.reduce((sum, row) => sum + row.invested, 0);
  const pricedRows = rows.filter((row) => row.value !== undefined);
  const pricedInvestment = pricedRows.reduce((sum, row) => sum + row.invested, 0);
  const partialValue = pricedRows.reduce((sum, row) => sum + row.value!, 0);
  const complete = pricedRows.length === rows.length;
  const currentValue = complete ? partialValue : undefined;
  const totalReturn = complete ? partialValue - totalInvestment : undefined;
  return {
    totalInvestment,
    pricedInvestment,
    currentValue,
    partialValue,
    totalReturn,
    returnPercentage: totalReturn !== undefined && totalInvestment > 0
      ? (totalReturn / totalInvestment) * 100
      : undefined,
    pricedHoldings: pricedRows.length,
    missingHoldings: rows.length - pricedRows.length,
    staleHoldings: pricedRows.filter((row) => row.quoteStatus === 'stale').length,
    complete,
  };
}

export function computeAllocation(rows: readonly PortfolioRow[], partialValue: number) {
  return [...rows]
    .filter((row) => row.value !== undefined)
    .sort((first, second) => second.value! - first.value!)
    .map((row) => ({
      ...row,
      share: partialValue > 0 ? (row.value! / partialValue) * 100 : 0,
    }));
}
