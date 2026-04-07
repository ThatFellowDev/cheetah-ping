export default function MonitorLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 bg-white/5 animate-pulse rounded-lg" />
        <div className="flex-1">
          <div className="h-7 w-48 bg-white/5 animate-pulse rounded mb-1" />
          <div className="h-4 w-64 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
      <div className="glass rounded-xl p-6">
        <div className="h-5 w-20 bg-white/5 animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
              <div className="h-4 w-32 bg-white/5 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
