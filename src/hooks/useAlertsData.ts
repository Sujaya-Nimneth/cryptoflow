'use client';

import { useCallback } from 'react';
import { useLocalUserData } from '@/hooks/useLocalUserData';
import { useCloudCollection } from '@/hooks/useCloudCollection';
import { useUserDataContext } from '@/components/UserDataProvider';
import { LOCAL_USER_DATA_KEYS } from '@/lib/localUserData';
import { localAlertsSchema } from '@/lib/userDataSchemas';
import {
  deleteCloudAlert,
  insertCloudAlert,
  loadCloudAlerts,
} from '@/lib/supabase/userData';
import type { PriceAlert } from '@/types';

const EMPTY_ALERTS = { version: 1 as const, alerts: [] as PriceAlert[] };

export function useAlertsData() {
  const { mode, identity } = useUserDataContext();
  const local = useLocalUserData(LOCAL_USER_DATA_KEYS.alerts, localAlertsSchema, EMPTY_ALERTS);
  const cloud = useCloudCollection({
    enabled: mode === 'cloud',
    userId: identity?.id ?? null,
    cacheKey: `cloud:alerts:${identity?.id ?? 'anonymous'}`,
    schema: localAlertsSchema,
    fallback: EMPTY_ALERTS,
    getItems: (state) => state.alerts,
    withItems: (state, alerts) => ({ ...state, alerts }),
    load: loadCloudAlerts,
    insert: insertCloudAlert,
    remove: deleteCloudAlert,
  });

  const addAlert = useCallback(async (alert: PriceAlert) => {
    if (mode === 'cloud') return cloud.add(alert);
    return local.setValue((current) => ({ version: 1, alerts: [alert, ...current.alerts] }));
  }, [cloud, local, mode]);

  const deleteAlert = useCallback(async (id: string) => {
    if (mode === 'cloud') return cloud.deleteItem(id);
    return local.setValue((current) => ({ version: 1, alerts: current.alerts.filter((alert) => alert.id !== id) }));
  }, [cloud, local, mode]);

  if (mode === 'cloud') {
    return {
      alerts: cloud.value.alerts,
      status: cloud.status,
      pending: cloud.pending,
      error: cloud.error,
      addAlert,
      deleteAlert,
      resetInvalid: () => undefined,
    };
  }
  return {
    alerts: local.value.alerts,
    status: local.status,
    pending: false,
    error: null,
    addAlert,
    deleteAlert,
    resetInvalid: local.resetInvalid,
  };
}
