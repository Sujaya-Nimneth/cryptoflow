import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readLocalData, writeLocalData } from './localUserData';
import { localPortfolioSchema } from './userDataSchemas';

const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
};

describe('versioned local user data', () => {
  it('round-trips validated data', () => {
    const storage = memoryStorage();
    const value = {
      version: 1 as const,
      holdings: [{ id: '00000000-0000-4000-8000-000000000001', cryptoId: 'bitcoin', quantity: 0.5, purchasePrice: 40000 }],
    };
    expect(writeLocalData(storage, 'portfolio', localPortfolioSchema, value)).toBe(true);
    expect(readLocalData(storage, 'portfolio', localPortfolioSchema, { version: 1, holdings: [] })).toEqual({ value, status: 'ready' });
  });

  it('does not overwrite invalid or unsupported stored data', () => {
    const storage = memoryStorage();
    storage.setItem('portfolio', '{broken');
    const result = readLocalData(storage, 'portfolio', localPortfolioSchema, { version: 1, holdings: [] });
    expect(result.status).toBe('invalid');
    expect(storage.getItem('portfolio')).toBe('{broken');
  });

  it('reports unavailable storage without throwing', () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readLocalData(storage, 'key', z.string(), 'fallback').status).toBe('unavailable');
    expect(writeLocalData(storage, 'key', z.string(), 'value')).toBe(false);
  });

  it('rejects duplicate identifiers and unsupported versions', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const holding = { id, cryptoId: 'bitcoin', quantity: 1, purchasePrice: 10 };
    expect(localPortfolioSchema.safeParse({ version: 1, holdings: [holding, holding] }).success).toBe(false);
    expect(localPortfolioSchema.safeParse({ version: 2, holdings: [] }).success).toBe(false);
  });
});
