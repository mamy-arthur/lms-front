import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/cn';
import { Role } from '@/shared/constants/roles';

interface UserRoleBadgeProps {
  role: Role;
}

const ROLE_CONFIG: Record<Role, { label: string; className: string }> = {
  [Role.SUPER_ADMIN]: {
    label: 'Super admin',
    className: 'bg-red-500 text-white',
  },
  [Role.EDITOR]: {
    label: 'Éditeur',
    className: 'bg-orange-500 text-white',
  },
  [Role.CLIENT_MANAGER]: {
    label: 'Responsable',
    className: 'bg-indigo-500 text-white',
  },
  [Role.TRAINEE]: {
    label: 'Stagiaire',
    className: 'bg-sky-500 text-white',
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
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
        config.className,
      )}
    >
      {config.label}
    </Badge>
  );
}
