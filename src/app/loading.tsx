export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="h-9 w-64 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-xl bg-slate-800/70" />
        ))}
      </div>
    </div>
  );
}
