import { NextResponse, type NextRequest } from 'next/server';

const UPSTREAM = process.env.NEXT_PUBLIC_CRYPTO_API_URL || 'https://api.coingecko.com/api/v3';

/** Cache windows tuned to how often each dataset actually changes. */
const REVALIDATE = {
  markets: 30,
  ohlc: 300,
  global: 60,
} as const;

type RouteKind = keyof typeof REVALIDATE;

function classify(pathname: string[]): RouteKind | null {
  if (pathname[0] === 'coins' && pathname[1] === 'markets') return 'markets';
  if (pathname[0] === 'coins' && pathname[2] === 'ohlc') return 'ohlc';
  if (pathname[0] === 'global') return 'global';
  return null;
}

function upstreamUrl(kind: RouteKind, pathname: string[], search: string): string {
  if (kind === 'ohlc') {
    return `${UPSTREAM}/coins/${encodeURIComponent(pathname[1])}/ohlc?${search}`;
  }
  if (kind === 'markets') {
    return `${UPSTREAM}/coins/markets?${search}`;
  }
  return `${UPSTREAM}/global?${search}`;
}

/**
 * Server-side proxy for CoinGecko.
 *
 * Fetching from the browser both leaks the free-tier rate limit per visitor and
 * fails CORS entirely when CoinGecko answers with an error (the 429/5xx responses
 * carry no Access-Control-Allow-Origin). Routing through the server lets Next.js
 * cache the shared responses and return a consistent error shape.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const kind = classify(path);

  if (!kind) {
    return NextResponse.json({ error: 'Unsupported path' }, { status: 404 });
  }

  const search = new URL(request.url).searchParams.toString();
  const revalidate = REVALIDATE[kind];

  try {
    const upstream = await fetch(upstreamUrl(kind, path, search), {
      headers: { accept: 'application/json' },
      next: { revalidate },
    });

    if (!upstream.ok) {
      const retryAfter = upstream.headers.get('retry-after');
      return NextResponse.json(
        { error: `Upstream responded with ${upstream.status}` },
        {
          status: upstream.status,
          headers: retryAfter ? { 'retry-after': retryAfter } : undefined,
        }
      );
    }

    return NextResponse.json(await upstream.json(), {
      headers: {
        'cache-control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
