import { describe, expect, it } from 'vitest';
import { isAlertTriggered } from './alerts';

describe('isAlertTriggered', () => {
  it('does not trigger while the price is unknown', () => {
    expect(isAlertTriggered('below', 1000, undefined)).toBe(false);
    expect(isAlertTriggered('above', 1000, undefined)).toBe(false);
  });

  it('triggers "above" once the price reaches the target', () => {
    expect(isAlertTriggered('above', 100, 99.99)).toBe(false);
    expect(isAlertTriggered('above', 100, 100)).toBe(true);
    expect(isAlertTriggered('above', 100, 120)).toBe(true);
  });

  it('triggers "below" once the price falls to the target', () => {
    expect(isAlertTriggered('below', 100, 100.01)).toBe(false);
    expect(isAlertTriggered('below', 100, 100)).toBe(true);
    expect(isAlertTriggered('below', 100, 80)).toBe(true);
  });
});
