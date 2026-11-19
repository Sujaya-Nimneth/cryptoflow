import type { NextRequest } from 'next/server';
import { hasSupabaseAuthCookie } from '@/lib/supabase/config';
import { refreshSupabaseSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  if (!hasSupabaseAuthCookie(request.cookies.getAll().map(({ name }) => name))) {
    return undefined;
  }
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ['/', '/auth/:path*'],
};
