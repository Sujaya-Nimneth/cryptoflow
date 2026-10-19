export type AlertDirection = 'above' | 'below';

/**
 * A price alert fires when the live quote crosses the target in the chosen
 * direction. Unknown quotes never fire so alerts do not trigger before data loads.
 */
export function isAlertTriggered(
  direction: AlertDirection,
  targetPrice: number,
  currentPrice: number | undefined
): boolean {
  if (currentPrice === undefined) return false;
  return direction === 'above' ? currentPrice >= targetPrice : currentPrice <= targetPrice;
}
