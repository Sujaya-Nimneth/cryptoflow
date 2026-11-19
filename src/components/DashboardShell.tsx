'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { Button } from './ui/Button';
import { useUserDataContext } from './UserDataProvider';

const DashboardTabs = dynamic(() => import('./DashboardTabs'), {
  loading: () => <div className="h-64 rounded-xl bg-slate-800/60" aria-hidden="true" />,
});

export default function DashboardShell() {
  const { mode, cloudConfigured, identity } = useUserDataContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const currentParams = new URLSearchParams(query);
  currentParams.delete('storage');
  const currentQuery = currentParams.toString();
  const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname;
  const localParams = new URLSearchParams(query);
  localParams.set('storage', 'local');
  const localPath = `${pathname}?${localParams.toString()}`;

  function showDeviceStorage() {
    router.replace(localPath);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{mode === 'cloud' ? 'Cloud account' : 'This device'}</p>
          <p className="break-words text-sm text-slate-400">
            {mode === 'cloud' ? identity?.email : 'Changes stay in this browser. No account is required.'}
          </p>
        </div>
        {mode === 'cloud' ? (
          <div className="flex flex-wrap gap-2">
            <form action={signOut}>
              <input type="hidden" name="next" value={localPath} />
              <Button type="submit" variant="secondary">Sign out</Button>
            </form>
            <Button variant="ghost" onClick={showDeviceStorage}>View device data</Button>
          </div>
        ) : identity ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.replace(currentPath)}>Use cloud account</Button>
            <form action={signOut}>
              <input type="hidden" name="next" value={localPath} />
              <Button type="submit" variant="ghost">Sign out</Button>
            </form>
          </div>
        ) : cloudConfigured ? (
          <Button variant="secondary" onClick={() => router.push(`/auth?next=${encodeURIComponent(currentPath)}`)}>
            Sign in for cloud storage
          </Button>
        ) : (
          <span className="text-sm text-slate-400">Device-local storage</span>
        )}
      </div>
      <DashboardTabs />
    </div>
  );
}
