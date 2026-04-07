import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClass } from '@/lib/status-colors';

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={`${getStatusBadgeClass(status)} gap-1.5`}>
      {status === 'active' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
