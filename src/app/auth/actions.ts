'use server';

import { redirect } from 'next/navigation';
import { authErrorMessage, credentialsSchema, safeAuthRedirect, type CredentialField } from '@/lib/authSchemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthActionState {
  message: string | null;
  needsConfirmation: boolean;
  field?: CredentialField;
  values?: { email: string; password: string };
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
    const emailIssue = parsed.error.issues.some((issue) => issue.path[0] === 'email');
    return {
      message: emailIssue ? 'Enter a valid email address.' : 'Use 8–128 password characters, including letters and numbers.',
      needsConfirmation: false,
      field: emailIssue ? 'email' : 'password',
    };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { message: 'Cloud sign-in is temporarily unavailable. Try again, or continue with device-local storage.', needsConfirmation: false };
  }
  if (!supabase) return { message: 'Cloud storage is not configured.', needsConfirmation: false };
  const next = safeAuthRedirect(String(formData.get('next') ?? '/'));
  const { email, password } = parsed.data;

  try {
    if (mode === 'sign-up') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return {
          ...authErrorMessage(mode, error),
          needsConfirmation: false,
          values: { email, password: '' },
        };
      }
      if (!data.session) return { message: 'Check your email to confirm the account, then sign in.', needsConfirmation: true };
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return {
          ...authErrorMessage(mode, error),
          needsConfirmation: false,
          values: { email, password: '' },
        };
      }
    }
  } catch {
    return {
      message: 'Cloud sign-in is temporarily unavailable. Try again, or continue with device-local storage.',
      needsConfirmation: false,
      values: { email, password: '' },
    };
  }

  redirect(next);
}

export async function signOut(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.auth.signOut({ scope: 'local' });
  } catch {
    redirect(safeAuthRedirect(String(formData.get('next') ?? '/')));
  }
  redirect(safeAuthRedirect(String(formData.get('next') ?? '/')));
}
