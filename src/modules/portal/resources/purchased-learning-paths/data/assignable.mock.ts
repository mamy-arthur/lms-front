import type { AssignableGroup, TenantAssignableUser } from '../types';

const TENANT_USERS: TenantAssignableUser[] = [
  { id: 'u-acme-1', tenantId: 'tenant-001', fullName: 'Lina Dupuis' },
  { id: 'u-acme-2', tenantId: 'tenant-001', fullName: 'Yassine Bensaid' },
  { id: 'u-acme-3', tenantId: 'tenant-001', fullName: 'Nina Caron' },
  { id: 'u-acme-4', tenantId: 'tenant-001', fullName: 'Jules Marchal' },
  { id: 'u-acme-5', tenantId: 'tenant-001', fullName: 'Sonia Kebe' },
  { id: 'u-acme-6', tenantId: 'tenant-001', fullName: 'Amine Rachid' },
  { id: 'u-beta-1', tenantId: 'tenant-002', fullName: 'Eva Moulin' },
  { id: 'u-beta-2', tenantId: 'tenant-002', fullName: 'Hugo Marin' },
  { id: 'u-beta-3', tenantId: 'tenant-002', fullName: 'Sara Gomis' },
  { id: 'u-globex-1', tenantId: 'tenant-004', fullName: 'Mariam Cisse' },
  { id: 'u-globex-2', tenantId: 'tenant-004', fullName: 'Thomas Dumas' },
  { id: 'u-globex-3', tenantId: 'tenant-004', fullName: 'Rania Boudiaf' },
  { id: 'u-globex-4', tenantId: 'tenant-004', fullName: 'Adel Benali' },
];

const TENANT_GROUPS: AssignableGroup[] = [
  {
    id: 'grp-acme-sales',
    tenantId: 'tenant-001',
    name: 'Sales France',
    userIds: ['u-acme-1', 'u-acme-2', 'u-acme-4'],
  },
  {
    id: 'grp-acme-support',
    tenantId: 'tenant-001',
    name: 'Support Niveau 1',
    userIds: ['u-acme-3', 'u-acme-5'],
  },
  {
    id: 'grp-beta-ops',
    tenantId: 'tenant-002',
    name: 'Ops Beta',
    userIds: ['u-beta-1', 'u-beta-2', 'u-beta-3'],
  },
  {
    id: 'grp-globex-lms',
    tenantId: 'tenant-004',
    name: 'Equipe LMS',
    userIds: ['u-globex-1', 'u-globex-2'],
  },
  {
    id: 'grp-globex-rh',
    tenantId: 'tenant-004',
    name: 'Ressources Humaines',
    userIds: ['u-globex-3', 'u-globex-4'],
  },
];

export function getAllTenantAssignableUsers() {
  return TENANT_USERS;
}

export function getAllTenantGroups() {
  return TENANT_GROUPS;
}

export function getTenantAssignableUsers(tenantId: string) {
  return TENANT_USERS.filter((u) => u.tenantId === tenantId);
}

export function getTenantGroups(tenantId: string) {
  return TENANT_GROUPS.filter((g) => g.tenantId === tenantId);
}
