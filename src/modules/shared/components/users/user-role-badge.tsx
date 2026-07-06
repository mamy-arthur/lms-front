import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/cn';
import { Role } from '@/shared/constants/roles';

interface UserRoleBadgeProps {
  role: Role;
}

const ROLE_CONFIG: Record<Role, { label: string; className: string }> = {
  [Role.SUPER_ADMIN]: {
    label: 'Super admin',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
  },
  [Role.EDITOR]: {
    label: 'Éditeur',
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
  },
  [Role.CLIENT_MANAGER]: {
    label: 'Responsable',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50',
  },
  [Role.TRAINEE]: {
    label: 'Stagiaire',
    className: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50',
  },
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role];

  if (!config) {
    return (
      <Badge variant="outline" className="text-xs font-medium">
        {role}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
        config.className,
      )}
    >
      {config.label}
    </Badge>
  );
}
