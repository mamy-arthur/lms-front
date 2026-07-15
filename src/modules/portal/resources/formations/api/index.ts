import {
  getAllPurchasedFormations,
  getAllTenantAssignableUsers,
  getAllTenantGroups,
} from '../data/formations.mock';
import type { FormationManagementQueryResult, PurchasedFormation } from '../types';

function cloneFormation(formation: PurchasedFormation): PurchasedFormation {
  return {
    ...formation,
    enrollments: formation.enrollments.map((enrollment) => ({ ...enrollment })),
  };
}

export const ClientFormationManagementApi = {
  async getAll(): Promise<FormationManagementQueryResult> {
    const formations = getAllPurchasedFormations().map(cloneFormation);
    const users = getAllTenantAssignableUsers().map((user) => ({ ...user }));
    const groups = getAllTenantGroups().map((group) => ({ ...group, userIds: [...group.userIds] }));

    return { formations, users, groups };
  },
} as const;
