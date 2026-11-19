import { describe, expect, it } from 'vitest';
import { hasSupabaseAuthCookie, resolveSupabaseConfig } from './config';

const publishableKey = 'sb_publishable_test_key_for_unit_tests';

describe('Supabase public configuration', () => {
  it('keeps cloud storage optional', () => {
    expect(resolveSupabaseConfig(undefined, undefined)).toBeNull();
    expect(resolveSupabaseConfig('https://example.supabase.co', undefined)).toBeNull();
  });

  it('accepts a hosted publishable key and local development URL', () => {
    expect(resolveSupabaseConfig('https://example.supabase.co', publishableKey)).toEqual({
      url: 'https://example.supabase.co',
      publishableKey,
    });
    expect(resolveSupabaseConfig('http://127.0.0.1:54321', publishableKey)).not.toBeNull();
  });

  it('rejects insecure remote URLs and secret keys', () => {
    expect(resolveSupabaseConfig('http://example.supabase.co', publishableKey)).toBeNull();
    expect(resolveSupabaseConfig('https://example.supabase.co', 'sb_secret_never_public')).toBeNull();
  });

  it('recognizes only auth cookies, including chunked cookies', () => {
    expect(hasSupabaseAuthCookie(['theme', 'sb-project-auth-token.0'])).toBe(true);
    expect(hasSupabaseAuthCookie(['theme', 'sb-project-code-verifier'])).toBe(false);
  });
});
