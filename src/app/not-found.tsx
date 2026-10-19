import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-400">404</p>
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <p className="text-sm text-slate-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
