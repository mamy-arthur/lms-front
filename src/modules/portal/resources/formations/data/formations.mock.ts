import type {
  FormationEnrollment,
  FormationGroup,
  PurchasedFormation,
  TenantAssignableUser,
} from '../types';

interface FormationCatalogItem {
  id: string;
  name: string;
}

interface TenantFormationPurchase {
  id: string;
  tenantId: string;
  formationId: string;
  purchasedCredits: number;
  durationMonths: number;
}

const DAYS_PER_MONTH = 30;

const FORMATION_CATALOG: FormationCatalogItem[] = [
  { id: 'formation-react', name: 'React avancé pour équipes produit' },
  { id: 'formation-ts', name: 'TypeScript professionnel' },
  { id: 'formation-devops', name: 'DevOps et CI/CD pour entreprises' },
  { id: 'formation-cyber', name: 'Hygiène cybersécurité au quotidien' },
  { id: 'formation-design', name: 'UX writing et parcours apprenant' },
];

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

const TENANT_GROUPS: FormationGroup[] = [
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

const TENANT_FORMATION_PURCHASES: TenantFormationPurchase[] = [
  {
    id: 'purchase-acme-react',
    tenantId: 'tenant-001',
    formationId: 'formation-react',
    purchasedCredits: 20,
    durationMonths: 3,
  },
  {
    id: 'purchase-acme-ts',
    tenantId: 'tenant-001',
    formationId: 'formation-ts',
    purchasedCredits: 16,
    durationMonths: 2,
  },
  {
    id: 'purchase-acme-devops',
    tenantId: 'tenant-001',
    formationId: 'formation-devops',
    purchasedCredits: 10,
    durationMonths: 4,
  },
  {
    id: 'purchase-beta-cyber',
    tenantId: 'tenant-002',
    formationId: 'formation-cyber',
    purchasedCredits: 12,
    durationMonths: 2,
  },
  {
    id: 'purchase-beta-design',
    tenantId: 'tenant-002',
    formationId: 'formation-design',
    purchasedCredits: 8,
    durationMonths: 1,
  },
  {
    id: 'purchase-globex-react',
    tenantId: 'tenant-004',
    formationId: 'formation-react',
    purchasedCredits: 14,
    durationMonths: 3,
  },
  {
    id: 'purchase-globex-cyber',
    tenantId: 'tenant-004',
    formationId: 'formation-cyber',
    purchasedCredits: 12,
    durationMonths: 2,
  },
];

const FORMATION_ENROLLMENTS: Record<string, FormationEnrollment[]> = {
  'purchase-acme-react': [
    {
      id: 'en-acme-react-1',
      userId: 'u-acme-1',
      fullName: 'Lina Dupuis',
      enrolledAt: '2026-07-02T09:15:00.000Z',
      groupName: 'Sales France',
      startedAt: '2026-07-03T08:00:00.000Z',
      completedAt: null,
      plannedDurationDays: 90,
      actualDurationDays: null,
    },
    {
      id: 'en-acme-react-2',
      userId: 'u-acme-2',
      fullName: 'Yassine Bensaid',
      enrolledAt: '2026-07-09T10:20:00.000Z',
      groupName: 'Sales France',
      startedAt: null,
      completedAt: null,
      plannedDurationDays: 90,
      actualDurationDays: null,
    },
    {
      id: 'en-acme-react-3',
      userId: 'u-acme-3',
      fullName: 'Nina Caron',
      enrolledAt: '2026-06-21T13:50:00.000Z',
      groupName: 'Support Niveau 1',
      startedAt: '2026-06-22T08:00:00.000Z',
      completedAt: '2026-07-04T17:10:00.000Z',
      plannedDurationDays: 90,
      actualDurationDays: 13,
    },
  ],
  'purchase-acme-ts': [
    {
      id: 'en-acme-ts-1',
      userId: 'u-acme-4',
      fullName: 'Jules Marchal',
      enrolledAt: '2026-07-06T11:00:00.000Z',
      groupName: 'Sales France',
      startedAt: '2026-07-07T08:00:00.000Z',
      completedAt: null,
      plannedDurationDays: 60,
      actualDurationDays: null,
    },
    {
      id: 'en-acme-ts-2',
      userId: 'u-acme-5',
      fullName: 'Sonia Kebe',
      enrolledAt: '2026-05-14T11:00:00.000Z',
      groupName: 'Support Niveau 1',
      startedAt: '2026-05-15T08:00:00.000Z',
      completedAt: '2026-06-03T14:30:00.000Z',
      plannedDurationDays: 60,
      actualDurationDays: 20,
    },
  ],
  'purchase-acme-devops': [
    {
      id: 'en-acme-devops-1',
      userId: 'u-acme-6',
      fullName: 'Amine Rachid',
      enrolledAt: '2026-07-10T16:20:00.000Z',
      groupName: null,
      startedAt: null,
      completedAt: null,
      plannedDurationDays: 120,
      actualDurationDays: null,
    },
  ],
  'purchase-beta-cyber': [
    {
      id: 'en-beta-cyber-1',
      userId: 'u-beta-1',
      fullName: 'Eva Moulin',
      enrolledAt: '2026-07-01T08:30:00.000Z',
      groupName: 'Ops Beta',
      startedAt: '2026-07-01T09:00:00.000Z',
      completedAt: null,
      plannedDurationDays: 60,
      actualDurationDays: null,
    },
  ],
  'purchase-beta-design': [],
  'purchase-globex-react': [
    {
      id: 'en-globex-react-1',
      userId: 'u-globex-1',
      fullName: 'Mariam Cisse',
      enrolledAt: '2026-07-05T09:00:00.000Z',
      groupName: 'Equipe LMS',
      startedAt: '2026-07-06T08:30:00.000Z',
      completedAt: null,
      plannedDurationDays: 90,
      actualDurationDays: null,
    },
    {
      id: 'en-globex-react-2',
      userId: 'u-globex-2',
      fullName: 'Thomas Dumas',
      enrolledAt: '2026-07-11T10:20:00.000Z',
      groupName: 'Equipe LMS',
      startedAt: null,
      completedAt: null,
      plannedDurationDays: 90,
      actualDurationDays: null,
    },
  ],
  'purchase-globex-cyber': [
    {
      id: 'en-globex-cyber-1',
      userId: 'u-globex-3',
      fullName: 'Rania Boudiaf',
      enrolledAt: '2026-06-24T14:10:00.000Z',
      groupName: 'Ressources Humaines',
      startedAt: '2026-06-25T09:00:00.000Z',
      completedAt: null,
      plannedDurationDays: 60,
      actualDurationDays: null,
    },
  ],
};

export function convertMonthsToDays(months: number) {
  return Math.max(0, Math.trunc(months)) * DAYS_PER_MONTH;
}

function buildFormations(purchases: typeof TENANT_FORMATION_PURCHASES): PurchasedFormation[] {
  return purchases
    .map((purchase) => {
      const catalogItem = FORMATION_CATALOG.find((item) => item.id === purchase.formationId);
      if (!catalogItem) return null;
      return {
        id: purchase.id,
        tenantId: purchase.tenantId,
        name: catalogItem.name,
        purchasedCredits: purchase.purchasedCredits,
        durationMonths: purchase.durationMonths,
        durationDays: convertMonthsToDays(purchase.durationMonths),
        enrollments: FORMATION_ENROLLMENTS[purchase.id] ?? [],
      } satisfies PurchasedFormation;
    })
    .filter((f): f is PurchasedFormation => f !== null);
}

export function getAllPurchasedFormations(): PurchasedFormation[] {
  return buildFormations(TENANT_FORMATION_PURCHASES);
}

export function getAllTenantAssignableUsers() {
  return TENANT_USERS;
}

export function getAllTenantGroups() {
  return TENANT_GROUPS;
}

// Kept for future API-backed filtering
export function getPurchasedFormationsByTenant(tenantId: string): PurchasedFormation[] {
  return buildFormations(TENANT_FORMATION_PURCHASES.filter((p) => p.tenantId === tenantId));
}

export function getTenantAssignableUsers(tenantId: string) {
  return TENANT_USERS.filter((u) => u.tenantId === tenantId);
}

export function getTenantGroups(tenantId: string) {
  return TENANT_GROUPS.filter((g) => g.tenantId === tenantId);
}
