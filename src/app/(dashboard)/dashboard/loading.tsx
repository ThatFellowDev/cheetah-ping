export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-9 w-36 bg-white/5 animate-pulse rounded-xl" />
      </div>
      <div className="h-4 bg-white/5 animate-pulse rounded-lg w-48" />
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-4" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="space-y-2">
              <div className="h-5 w-48 bg-white/5 animate-pulse rounded" />
              <div className="h-4 w-64 bg-white/5 animate-pulse rounded" />
              <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
