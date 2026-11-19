import { z } from 'zod';

const supabaseConfigSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' || (
      url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
    );
  }, 'Supabase must use HTTPS, except for local development'),
  publishableKey: z.string().min(20).refine(
    (value) => !value.startsWith('sb_secret_'),
    'A secret key must never be used in a public client'
  ),
});

export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;

export function resolveSupabaseConfig(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
): SupabaseConfig | null {
  if (!url && !publishableKey) return null;
  const parsed = supabaseConfigSchema.safeParse({ url, publishableKey });
  return parsed.success ? parsed.data : null;
}

export function hasSupabaseAuthCookie(cookieNames: readonly string[]): boolean {
  return cookieNames.some((name) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}
