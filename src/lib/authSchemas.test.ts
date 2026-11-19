import { describe, expect, it } from 'vitest';
import { authErrorMessage, credentialsSchema, safeAuthRedirect, validateCredentialFields } from './authSchemas';

describe('authentication input boundaries', () => {
  it('normalizes valid credentials and rejects weak passwords', () => {
    expect(credentialsSchema.parse({ email: ' USER@EXAMPLE.COM ', password: 'Password123' })).toEqual({
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(credentialsSchema.safeParse({ email: 'user@example.com', password: 'password' }).success).toBe(false);
  });

  it('only permits relative return paths', () => {
    expect(safeAuthRedirect('/?tab=portfolio')).toBe('/?tab=portfolio');
    expect(safeAuthRedirect('https://attacker.example')).toBe('/');
    expect(safeAuthRedirect('//attacker.example')).toBe('/');
    expect(safeAuthRedirect('/\\attacker.example')).toBe('/');
  });

  it('returns field-specific validation without exposing submitted credentials', () => {
    expect(validateCredentialFields({ email: 'invalid', password: 'short' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Use 8–128 characters, including letters and numbers.',
    });
    expect(validateCredentialFields({ email: 'user@example.com', password: 'Password123' })).toEqual({});
  });

  it.each([
    ['invalid_credentials', 'incorrect', 'password'],
    ['email_not_confirmed', 'Confirm your email', 'email'],
    ['user_already_exists', 'already uses this email', 'email'],
    ['weak_password', 'stronger password', 'password'],
    ['over_request_rate_limit', 'Wait a few minutes', undefined],
  ] as const)('maps the %s error code to a useful next step', (code, text, field) => {
    const result = authErrorMessage('sign-in', { code, status: 400 });
    expect(result.message).toContain(text);
    expect(result.field).toBe(field);
  });

  it('distinguishes a service outage from invalid credentials', () => {
    expect(authErrorMessage('sign-in', { name: 'AuthRetryableFetchError' }).message).toContain('temporarily unavailable');
    expect(authErrorMessage('sign-in', { status: 503 }).message).toContain('temporarily unavailable');
  });
});
