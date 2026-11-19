import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticate, signOut, type AuthActionState } from './actions';

const controls = vi.hoisted(() => ({
  client: null as null | { auth: {
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  } },
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => controls.client,
}));
vi.mock('next/navigation', () => ({ redirect: controls.redirect }));

const initialState: AuthActionState = { message: null, needsConfirmation: false };
const email = 'person@example.test';
const password = 'A-secure-password-123';

function credentials(next = '/?tab=portfolio') {
  const form = new FormData();
  form.set('email', email);
  form.set('password', password);
  form.set('next', next);
  return form;
}

afterEach(() => {
  vi.clearAllMocks();
  controls.client = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };
});

describe('authentication server actions', () => {
  it('rejects invalid credentials before creating a client', async () => {
    const form = new FormData();
    form.set('email', 'invalid');
    form.set('password', 'short');
    const state = await authenticate('sign-in', initialState, form);
    expect(state.field).toBe('email');
    expect(controls.redirect).not.toHaveBeenCalled();
  });

  it('redirects only to a safe relative path after sign-in', async () => {
    controls.client!.auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(authenticate('sign-in', initialState, credentials())).rejects.toThrow('redirect:/?tab=portfolio');
    expect(controls.client!.auth.signInWithPassword).toHaveBeenCalledWith({ email, password });

    await expect(authenticate('sign-in', initialState, credentials('https://attacker.example'))).rejects.toThrow('redirect:/');
  });

  it('returns field-specific errors without the submitted password', async () => {
    controls.client!.auth.signInWithPassword.mockResolvedValue({
      error: { code: 'invalid_credentials', status: 400 },
    });
    const state = await authenticate('sign-in', initialState, credentials());
    expect(state.message).toContain('incorrect');
    expect(state.field).toBe('password');
    expect(state.values).toEqual({ email, password: '' });
    expect(JSON.stringify(state)).not.toContain(password);
  });

  it('explains email confirmation before redirecting', async () => {
    controls.client!.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const state = await authenticate('sign-up', initialState, credentials());
    expect(state.needsConfirmation).toBe(true);
    expect(state.message).toContain('Check your email');
    expect(controls.redirect).not.toHaveBeenCalled();
  });

  it('contains auth outages without leaking credentials', async () => {
    controls.client!.auth.signInWithPassword.mockRejectedValue(new Error('network failure'));
    const state = await authenticate('sign-in', initialState, credentials());
    expect(state.message).toContain('temporarily unavailable');
    expect(state.values).toEqual({ email, password: '' });
    expect(JSON.stringify(state)).not.toContain(password);
  });

  it('reports unavailable cloud configuration', async () => {
    controls.client = null;
    const state = await authenticate('sign-in', initialState, credentials());
    expect(state.message).toBe('Cloud storage is not configured.');
    expect(controls.redirect).not.toHaveBeenCalled();
  });

  it('signs out locally and safely returns to device storage', async () => {
    controls.client!.auth.signOut.mockResolvedValue({ error: null });
    const form = new FormData();
    form.set('next', '/?storage=local');
    await expect(signOut(form)).rejects.toThrow('redirect:/?storage=local');
    expect(controls.client!.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
