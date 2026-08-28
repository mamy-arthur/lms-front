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
      {isActive ? 'Actif' : 'Inactif'}
    </Badge>
  );
}
