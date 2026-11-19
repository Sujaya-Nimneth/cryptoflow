import { describe, expect, it } from 'vitest';
import { firstInvalidField, positiveAmountError } from './formValidation';

describe('shared positive amount validation', () => {
  it.each(['', ' ', '0', '-1', 'Infinity', 'NaN', '1000000000001'])(
    'rejects %s with an actionable message',
    (value) => {
      expect(positiveAmountError(value, 'Quantity')).toMatch(/Enter|greater than zero|trillion/);
    }
  );

  it('accepts positive amounts through the persistence boundary', () => {
    expect(positiveAmountError('0.00000001', 'Quantity')).toBeNull();
    expect(positiveAmountError('1000000000000', 'Purchase price')).toBeNull();
  });

  it('focuses the first invalid control rather than the last error', () => {
    const form = document.createElement('form');
    const quantity = document.createElement('input');
    quantity.name = 'quantity';
    const price = document.createElement('input');
    price.name = 'purchasePrice';
    form.append(quantity, price);
    document.body.append(form);
    expect(firstInvalidField(form, {
      purchasePrice: 'Enter a purchase price.',
      quantity: 'Enter a quantity.',
    }, ['quantity', 'purchasePrice'])).toBe('quantity');
    expect(quantity).toHaveFocus();
    form.remove();
  });
});
