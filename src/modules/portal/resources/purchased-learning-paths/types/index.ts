export type PurchasedLearningPathStatKey = 'cumulative' | 'month' | 'inProgress' | 'notStarted';

export interface PurchasedLearningPathEnrollment {
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

export interface PurchasedLearningPath {
  id: string;
  tenantId: string;
  learningPathId: string;
  name: string;
  purchasedCredits: number;
  enrollments: PurchasedLearningPathEnrollment[];
}

export interface TenantAssignableUser {
  id: string;
  tenantId: string;
  fullName: string;
}

export interface AssignableGroup {
  id: string;
  tenantId: string;
  name: string;
  userIds: string[];
}

export interface PurchasedLearningPathStats {
  cumulative: number;
  month: number;
  inProgress: number;
  notStarted: number;
  availableCredits: number;
}

export interface PurchasedLearningPathRow extends PurchasedLearningPath {
  stats: PurchasedLearningPathStats;
}

export interface PurchasedLearningPathQueryParams {
  page?: number;
  perPage?: number;
}

export interface PurchasedLearningPathListMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface PurchasedLearningPathsQueryResult {
  purchasedLearningPaths: PurchasedLearningPath[];
  meta: PurchasedLearningPathListMeta;
}
