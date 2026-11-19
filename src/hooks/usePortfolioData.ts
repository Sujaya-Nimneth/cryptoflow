'use client';

import { useCallback } from 'react';
import { useLocalUserData } from '@/hooks/useLocalUserData';
import { useCloudCollection } from '@/hooks/useCloudCollection';
import { useUserDataContext } from '@/components/UserDataProvider';
import { LOCAL_USER_DATA_KEYS } from '@/lib/localUserData';
import { localPortfolioSchema } from '@/lib/userDataSchemas';
import {
  deleteCloudHolding,
  insertCloudHolding,
  loadCloudPortfolio,
} from '@/lib/supabase/userData';
import type { PortfolioHolding } from '@/types';

const EMPTY_PORTFOLIO = { version: 1 as const, holdings: [] as PortfolioHolding[] };

export function usePortfolioData() {
  const { mode, identity } = useUserDataContext();
  const local = useLocalUserData(LOCAL_USER_DATA_KEYS.portfolio, localPortfolioSchema, EMPTY_PORTFOLIO);
  const cloud = useCloudCollection({
    enabled: mode === 'cloud',
    userId: identity?.id ?? null,
    cacheKey: `cloud:portfolio:${identity?.id ?? 'anonymous'}`,
    schema: localPortfolioSchema,
    fallback: EMPTY_PORTFOLIO,
    getItems: (state) => state.holdings,
    withItems: (state, holdings) => ({ ...state, holdings }),
    load: loadCloudPortfolio,
    insert: insertCloudHolding,
    remove: deleteCloudHolding,
  });

  const addHolding = useCallback(async (holding: PortfolioHolding) => {
    if (mode === 'cloud') return cloud.add(holding);
    return local.setValue((current) => ({ version: 1, holdings: [...current.holdings, holding] }));
  }, [cloud, local, mode]);

  const deleteHolding = useCallback(async (id: string) => {
    if (mode === 'cloud') return cloud.deleteItem(id);
    return local.setValue((current) => ({ version: 1, holdings: current.holdings.filter((holding) => holding.id !== id) }));
  }, [cloud, local, mode]);

  if (mode === 'cloud') {
    return {
      holdings: cloud.value.holdings,
      status: cloud.status,
      pending: cloud.pending,
      error: cloud.error,
      addHolding,
      deleteHolding,
      resetInvalid: () => undefined,
    };
  }
  return {
    holdings: local.value.holdings,
    status: local.status,
    pending: false,
    error: null,
    addHolding,
    deleteHolding,
    resetInvalid: local.resetInvalid,
  };
}
