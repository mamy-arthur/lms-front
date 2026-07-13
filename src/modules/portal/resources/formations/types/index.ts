export type FormationStatKey = 'cumulative' | 'month' | 'inProgress' | 'notStarted';

export interface FormationEnrollment {
  id: string;
  userId: string;
  fullName: string;
  enrolledAt: string;
  groupName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  plannedDurationDays: number;
  actualDurationDays: number | null;
}

export interface PurchasedFormation {
  id: string;
  tenantId: string;
  name: string;
  purchasedCredits: number;
  durationMonths: number;
  durationDays: number;
  enrollments: FormationEnrollment[];
}

export interface TenantAssignableUser {
  id: string;
  tenantId: string;
  fullName: string;
}

export interface FormationGroup {
  id: string;
  tenantId: string;
  name: string;
  userIds: string[];
}

export interface FormationStats {
  cumulative: number;
  month: number;
  inProgress: number;
  notStarted: number;
  availableCredits: number;
}

export interface PurchasedFormationRow extends PurchasedFormation {
  stats: FormationStats;
}

export interface FormationManagementQueryResult {
  formations: PurchasedFormation[];
  users: TenantAssignableUser[];
  groups: FormationGroup[];
}

export interface AssignFormationToUsersPayload {
  formationId: string;
  userIds: string[];
  durationMonths: number;
}

export interface AssignFormationToGroupPayload {
  formationId: string;
  groupId: string;
  durationMonths: number;
}

export interface CreateFormationGroupPayload {
  tenantId: string;
  name: string;
  userIds: string[];
}
