import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveSupabaseConfig } from './config';

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = resolveSupabaseConfig();
  if (!config) return response;

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    response.headers.set('cache-control', 'private, no-store');
  }
  return response;
}
