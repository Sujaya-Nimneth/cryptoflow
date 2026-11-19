import { describe, expect, it } from 'vitest';
import { credentialsSchema, safeAuthRedirect } from './authSchemas';

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
});
