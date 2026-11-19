import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(8).max(128).refine(
    (password) => /[a-zA-Z]/.test(password) && /\d/.test(password),
    'Use at least eight characters with letters and numbers.'
  ),
});

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
