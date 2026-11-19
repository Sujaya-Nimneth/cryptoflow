'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { VerifiedIdentity } from '@/lib/supabase/server';

export type StorageMode = 'local' | 'cloud';

interface UserDataContextValue {
  mode: StorageMode;
  cloudConfigured: boolean;
  identity: VerifiedIdentity | null;
}

const UserDataContext = createContext<UserDataContextValue>({
  mode: 'local',
  cloudConfigured: false,
  identity: null,
});

export function UserDataProvider({
  mode,
  cloudConfigured,
  identity,
  children,
}: UserDataContextValue & { children: ReactNode }) {
  return (
    <UserDataContext.Provider value={{ mode, cloudConfigured, identity }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  return useContext(UserDataContext);
}
