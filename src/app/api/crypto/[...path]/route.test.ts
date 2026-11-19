import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const upstream = vi.hoisted(() => vi.fn());

vi.mock('@/lib/marketProxy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/marketProxy')>()),
  fetchUpstream: upstream,
}));

const globalPayload = {
  data: {
    total_market_cap: { usd: 2_500_000_000_000 },
    total_volume: { usd: 80_000_000_000 },
    market_cap_percentage: { btc: 52 },
    market_cap_change_percentage_24h_usd: 1.5,
    updated_at: 1_700_000_000,
  },
};

function request(path = ['global']) {
  return GET(new NextRequest(`http://127.0.0.1:3000/api/crypto/${path.join('/')}`), {
    params: Promise.resolve({ path }),
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('market proxy route', () => {
  it('rejects unsupported paths before contacting upstream', async () => {
    const response = await request(['search']);
    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('returns validated data with bounded cache headers', async () => {
    upstream.mockResolvedValue(Response.json(globalPayload));
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(globalPayload);
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=60, stale-while-revalidate=120');
  });

  it('propagates only safe numeric retry-after values', async () => {
    upstream.mockResolvedValue(Response.json({ error: 'limited' }, { status: 429, headers: { 'retry-after': '30' } }));
    const response = await request();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('30');

    upstream.mockResolvedValue(Response.json({ error: 'limited' }, { status: 429, headers: { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' } }));
    expect((await request()).headers.get('retry-after')).toBeNull();
  });

  it('maps upstream failures and malformed payloads to bounded errors', async () => {
    upstream.mockResolvedValue(Response.json({ error: 'outage' }, { status: 503 }));
    expect((await request()).status).toBe(502);

    upstream.mockResolvedValue(new Response('{broken'));
    expect((await request()).status).toBe(502);

    upstream.mockResolvedValue(Response.json({ data: {} }));
    expect((await request()).status).toBe(502);
  });

  it('rejects oversized responses before buffering the whole stream', async () => {
    upstream.mockResolvedValue(new Response('x', { headers: { 'content-length': '600000' } }));
    expect((await request()).status).toBe(502);

    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(300_000));
        controller.enqueue(new Uint8Array(300_000));
      },
      cancel() {
        cancelled = true;
      },
    });
    upstream.mockResolvedValue(new Response(stream));
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Market response is too large' });
    expect(cancelled).toBe(true);
  });

  it('returns a gateway timeout when the upstream deadline aborts', async () => {
    vi.useFakeTimers();
    upstream.mockImplementation((_request, signal: AbortSignal) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    const pending = request();
    await vi.advanceTimersByTimeAsync(8_000);
    const response = await pending;
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: 'Market data request timed out' });
  });
});
