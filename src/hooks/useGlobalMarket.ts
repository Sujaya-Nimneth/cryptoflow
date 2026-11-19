'use client';

import useSWR from 'swr';
import { getGlobalMarketData } from '@/lib/cryptoApi';
import { GLOBAL_REFRESH_MS } from '@/lib/marketSchemas';

export function useGlobalMarket() {
  return useSWR('/api/crypto/global', getGlobalMarketData, {
    refreshInterval: GLOBAL_REFRESH_MS,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    dedupingInterval: 5_000,
    errorRetryCount: 4,
  });
}
