import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/cn';

interface UserActiveBadgeProps {
  isActive: boolean;
}

export function UserActiveBadge({ isActive }: UserActiveBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full shrink-0',
          isActive ? 'bg-emerald-500' : 'bg-rose-500',
        )}
      />
      {isActive ? 'Actif' : 'Inactif'}
    </Badge>
  );
}
