'use server';

import { redirect } from 'next/navigation';
import { credentialsSchema, safeAuthRedirect } from '@/lib/authSchemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthActionState {
  message: string | null;
  needsConfirmation: boolean;
}

export async function authenticate(
  mode: 'sign-in' | 'sign-up',
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { message: 'Enter a valid email and a password with at least eight letters and numbers.', needsConfirmation: false };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { message: 'Cloud storage is not configured.', needsConfirmation: false };
  const next = safeAuthRedirect(String(formData.get('next') ?? '/'));
  const { email, password } = parsed.data;

  if (mode === 'sign-up') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { message: 'Could not create the account. Check the details and try again.', needsConfirmation: false };
    if (!data.session) return { message: 'Check your email to confirm the account, then sign in.', needsConfirmation: true };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { message: 'Email or password is incorrect, or the email is not confirmed.', needsConfirmation: false };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut({ scope: 'local' });
  redirect('/');
}
