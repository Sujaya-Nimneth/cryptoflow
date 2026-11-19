import { NextResponse, type NextRequest } from 'next/server';
import { fetchUpstream, resolveProxyRequest, validateProxyPayload } from '@/lib/marketProxy';

const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_PAYLOAD_BYTES = 512_000;

export async function GET(request: NextRequest, context: RouteContext<'/api/crypto/[...path]'>) {
  const { path } = await context.params;
  const proxyRequest = resolveProxyRequest(path, new URL(request.url).searchParams);
  if (!proxyRequest) {
    return NextResponse.json({ error: 'Unsupported market request' }, { status: 400 });
  }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), UPSTREAM_TIMEOUT_MS);
  const abort = () => timeout.abort();
  request.signal.addEventListener('abort', abort, { once: true });

  try {
    const upstream = await fetchUpstream(proxyRequest, timeout.signal);
    if (!upstream.ok) {
      const retryAfter = upstream.headers.get('retry-after');
      const status = upstream.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: upstream.status === 429 ? 'Market data is rate limited' : 'Market data is unavailable' },
        { status, headers: retryAfter ? { 'retry-after': retryAfter } : undefined }
      );
    }

    const length = Number(upstream.headers.get('content-length') ?? 0);
    if (length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Market response is too large' }, { status: 502 });
    }
    const body = await upstream.text();
    if (new TextEncoder().encode(body).byteLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Market response is too large' }, { status: 502 });
    }
    const payload = validateProxyPayload(proxyRequest.kind, JSON.parse(body));
    return NextResponse.json(payload, {
      headers: {
        'cache-control': `public, s-maxage=${proxyRequest.revalidate}, stale-while-revalidate=${proxyRequest.revalidate * 2}`,
      },
    });
  } catch {
    const status = timeout.signal.aborted && !request.signal.aborted ? 504 : 502;
    return NextResponse.json(
      { error: status === 504 ? 'Market data request timed out' : 'Market data is unavailable' },
      { status }
    );
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}
