import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { z } from 'zod';
import type { Database } from '@/types/database';
import { resolveSupabaseConfig } from './config';

const identitySchema = z.object({
  sub: z.uuid(),
  email: z.email().optional(),
  is_anonymous: z.boolean().optional(),
});

export interface VerifiedIdentity {
  id: string;
  email?: string;
}

export async function createSupabaseServerClient() {
  const config = resolveSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });
}

export const getVerifiedIdentity = cache(async (): Promise<VerifiedIdentity | null> => {
  if (!(await cookies()).getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  const identity = identitySchema.safeParse(data.claims);
  if (!identity.success || identity.data.is_anonymous) return null;
  return { id: identity.data.sub, email: identity.data.email };
});
