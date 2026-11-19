import { describe, expect, it } from 'vitest';
import { canonicalMarketQuery } from './marketSchemas';
import { resolveProxyRequest, upstreamOrigin, validateProxyPayload } from './marketProxy';

const marketQuery = () => new URLSearchParams(canonicalMarketQuery(['ethereum', 'bitcoin']));

function withExtraParam(key: string, value: string) {
  const query = marketQuery();
  query.append(key, value);
  return query;
}

describe('market proxy contract', () => {
  it('accepts and canonicalizes supported market queries', () => {
    const query = marketQuery();
    query.set('ids', 'ethereum,bitcoin');
    const request = resolveProxyRequest(['coins', 'markets'], query);
    expect(request?.kind).toBe('markets');
    expect(new URLSearchParams(request?.search).get('ids')).toBe('bitcoin,ethereum');
  });

  it.each([
    [['coins', 'markets', 'extra'], marketQuery()],
    [['global', 'extra'], new URLSearchParams()],
    [['search'], new URLSearchParams({ query: 'bitcoin' })],
    [['coins', 'markets'], withExtraParam('unexpected', 'value')],
    [['coins', 'markets'], withExtraParam('page', '2')],
    [['coins', 'unknown-coin', 'ohlc'], new URLSearchParams({ vs_currency: 'usd', days: '7' })],
    [['coins', 'bitcoin', 'ohlc'], new URLSearchParams({ vs_currency: 'usd', days: '2' })],
  ])('rejects unsupported paths and parameters', (path, query) => {
    expect(resolveProxyRequest(path, query)).toBeNull();
  });

  it('rejects duplicate parameters and malformed OHLC ranges', () => {
    const query = marketQuery();
    query.append('page', '1');
    expect(resolveProxyRequest(['coins', 'markets'], query)).toBeNull();
    expect(() => validateProxyPayload('ohlc', [[1, 10, 9, 8, 11]])).toThrow();
  });

  it('allows only the fixed upstream origin', () => {
    expect(upstreamOrigin(undefined)).toBe('https://api.coingecko.com/api/v3');
    expect(upstreamOrigin('https://api.coingecko.com/api/v3/')).toBe('https://api.coingecko.com/api/v3');
    expect(() => upstreamOrigin('https://example.com/api/v3')).toThrow();
    expect(() => upstreamOrigin('https://api.coingecko.com/api/v3?token=secret')).toThrow();
    expect(() => upstreamOrigin('http://api.coingecko.com/api/v3')).toThrow();
  });
});
