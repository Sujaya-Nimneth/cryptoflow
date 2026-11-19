import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { safeAuthRedirect } from '@/lib/authSchemas';
import { resolveSupabaseConfig } from '@/lib/supabase/config';
import { getVerifiedIdentity } from '@/lib/supabase/server';

export const metadata = { title: 'Cloud account' };

export default async function AuthPage({ searchParams }: PageProps<'/auth'>) {
  const params = await searchParams;
  const next = safeAuthRedirect(typeof params.next === 'string' ? params.next : null);
  if (await getVerifiedIdentity()) redirect(next);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-10 focus:outline-none">
      <div>
        <Link href={next} className="text-sm text-slate-300 underline underline-offset-4">Back to CryptoFlow</Link>
        <h1 className="mt-5 text-3xl font-semibold text-white">Your data, your choice.</h1>
        <p className="mt-2 text-slate-300">Continue without an account, or use an isolated cloud account.</p>
      </div>
      {resolveSupabaseConfig() ? <AuthForm next={next} /> : (
        <p role="status" className="rounded-lg border border-slate-600 p-4 text-slate-300">
          Cloud storage is not configured. Device-local portfolio, watchlist, and alerts remain available.
        </p>
      )}
    </main>
  );
}
