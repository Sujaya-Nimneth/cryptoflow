import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const controls = vi.hoisted(() => ({
  cookies: [] as Array<{ name: string; value: string }>,
  config: null as null | { url: string; publishableKey: string },
  claims: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => controls.cookies }) }));
vi.mock('./config', () => ({ resolveSupabaseConfig: () => controls.config }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getClaims: controls.claims } }),
}));

beforeEach(() => {
  controls.cookies = [{ name: 'sb-project-auth-token', value: 'session' }];
  controls.config = { url: 'http://127.0.0.1:54321', publishableKey: 'sb_publishable_test_key_123456789' };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('verified cloud identity', () => {
  it('accepts only verified non-anonymous claims', async () => {
    controls.claims.mockResolvedValue({
      data: { claims: { sub: '00000000-0000-4000-8000-000000000001', email: 'person@example.test', is_anonymous: false } },
      error: null,
    });
    const { getVerifiedIdentity } = await import('./server');
    expect(await getVerifiedIdentity()).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'person@example.test',
    });
  });

  it('rejects anonymous, malformed, and failed claim verification', async () => {
    const { getVerifiedIdentity } = await import('./server');
    controls.claims.mockResolvedValue({ data: { claims: { sub: '00000000-0000-4000-8000-000000000001', is_anonymous: true } }, error: null });
    expect(await getVerifiedIdentity()).toBeNull();

    vi.resetModules();
    controls.claims.mockResolvedValue({ data: { claims: { sub: 'not-a-uuid' } }, error: null });
    expect(await (await import('./server')).getVerifiedIdentity()).toBeNull();

    vi.resetModules();
    controls.claims.mockResolvedValue({ data: null, error: new Error('invalid token') });
    expect(await (await import('./server')).getVerifiedIdentity()).toBeNull();
  });

  it('does not contact Supabase without an auth cookie', async () => {
    controls.cookies = [];
    const { getVerifiedIdentity } = await import('./server');
    expect(await getVerifiedIdentity()).toBeNull();
    expect(controls.claims).not.toHaveBeenCalled();
  });
});
