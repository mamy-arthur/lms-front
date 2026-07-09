'use client';

import { UsersFilter } from '@modules/shared/components/users';

const ROLE_OPTIONS = [
  { value: 'CLIENT_MANAGER', label: 'Responsable' },
  { value: 'TRAINEE', label: 'Stagiaire' },
] as const;

export { ROLE_OPTIONS as TENANT_ROLE_OPTIONS };

interface ClientUsersFilterProps {
  roleFilter: string;
  statusFilter: string;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function ClientUsersFilter(props: ClientUsersFilterProps) {
  return <UsersFilter {...props} roleOptions={ROLE_OPTIONS} />;
}
