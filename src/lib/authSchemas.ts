import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(8).max(128).refine(
    (password) => /[a-zA-Z]/.test(password) && /\d/.test(password),
    'Use at least eight characters with letters and numbers.'
  ),
});

export type CredentialField = 'email' | 'password';
export type CredentialErrors = Partial<Record<CredentialField, string>>;

export function validateCredentialFields(values: { email: unknown; password: unknown }): CredentialErrors {
  const parsed = credentialsSchema.safeParse(values);
  if (parsed.success) return {};
  const fields = parsed.error.issues.reduce<CredentialErrors>((errors, issue) => {
    const field = issue.path[0];
    if ((field === 'email' || field === 'password') && !errors[field]) {
      errors[field] = field === 'email'
        ? 'Enter a valid email address.'
        : 'Use 8–128 characters, including letters and numbers.';
    }
    return errors;
  }, {});
  return fields;
}

export interface AuthErrorDetails {
  code?: string;
  name?: string;
  status?: number;
}

export function authErrorMessage(
  mode: 'sign-in' | 'sign-up',
  error: AuthErrorDetails
): { message: string; field?: CredentialField } {
  switch (error.code) {
    case 'invalid_credentials':
      return { message: 'Email or password is incorrect. Check both and try again.', field: 'password' };
    case 'email_not_confirmed':
      return { message: 'Confirm your email using the link we sent, then sign in.', field: 'email' };
    case 'email_exists':
    case 'user_already_exists':
      return { message: 'An account already uses this email. Sign in instead.', field: 'email' };
    case 'weak_password':
      return { message: 'Choose a stronger password with at least 8 characters, letters, and numbers.', field: 'password' };
    case 'email_address_invalid':
      return { message: 'This email address is not accepted. Use a different address.', field: 'email' };
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return { message: 'Too many attempts. Wait a few minutes before trying again.' };
    case 'signup_disabled':
    case 'email_provider_disabled':
      return { message: 'Account creation is currently unavailable. You can still use device-local storage.' };
    case 'email_address_not_authorized':
      return { message: 'This project cannot send confirmation email to that address. Contact the site administrator.' };
    case 'request_timeout':
      return { message: 'The sign-in service timed out. Check your connection and try again.' };
  }
  if (error.name === 'AuthRetryableFetchError' || (error.status !== undefined && error.status >= 500)) {
    return { message: 'Cloud sign-in is temporarily unavailable. Try again, or continue with device-local storage.' };
  }
  return {
    message: mode === 'sign-up'
      ? 'Could not create the account. Check your details and try again.'
      : 'Could not sign in. Check your details and try again.',
  };
}

export function safeAuthRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try {
    const url = new URL(value, 'https://cryptoflow.local');
    if (url.origin !== 'https://cryptoflow.local') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
