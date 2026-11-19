import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { resolveSupabaseConfig } from './config';

export function getSupabaseBrowserClient() {
  const config = resolveSupabaseConfig();
  if (!config) throw new Error('Cloud storage is not configured.');
  return createBrowserClient<Database>(config.url, config.publishableKey);
}
