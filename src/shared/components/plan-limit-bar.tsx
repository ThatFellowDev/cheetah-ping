interface PlanLimitBarProps {
  current: number;
  max: number;
  label?: string;
}

export function PlanLimitBar({ current, max, label = 'monitors' }: PlanLimitBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = current >= max - 1;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {current} of {max} {label} used
        </span>
        {isNearLimit && current < max && (
          <span className="text-amber-400 text-xs">Almost at limit</span>
        )}
        {current >= max && (
          <span className="text-destructive text-xs">At limit</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            current >= max
              ? 'bg-gradient-to-r from-red-500 to-red-400'
              : isNearLimit
              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
