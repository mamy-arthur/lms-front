export type PurchasedLearningPathStatKey = 'cumulative' | 'inProgress' | 'notStarted';

export interface PurchasedLearningPathEnrollment {
  id: string;
  userId: string;
  fullName: string;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PurchasedLearningPath {
  id: string;
  tenantId: string;
  learningPathId: string;
  name: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsAvailable: number;
  enrollmentsNotStartedCount: number;
  enrollmentsInProgressCount: number;
  enrollmentsCompletedCount: number;
  enrollmentsExpiredCount: number;
}

export interface TenantAssignableUser {
  id: string;
  tenantId: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AssignableGroup {
  id: string;
  tenantId: string;
  name: string;
  userIds: string[];
}

export interface PurchasedLearningPathStats {
  cumulative: number;
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
