import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

export type PurchasedLearningPathStatKey = 'cumulative' | 'inProgress' | 'notStarted';

export interface PurchasedLearningPathEnrollment {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

export interface PurchasedLearningPath {
  id: string;
  learningPathId: string;
  name: string;
  imageUrl?: string | null;
  categoryId: string | null;
  categoryName: string | null;
  creditsTotal: number;
  creditsUsed: number;
  creditsAvailable: number;
  enrollmentsNotStartedCount: number;
  enrollmentsInProgressCount: number;
  enrollmentsCompletedCount: number;
  enrollmentsExpiredCount: number;
}

export interface PurchasedLearningPathLearner {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    enrolledAt: string;
  } | null;
}

/** Apprenant dont l'enrollment est garanti non-null. */
export type EnrolledLearner = PurchasedLearningPathLearner & {
  enrollment: NonNullable<PurchasedLearningPathLearner['enrollment']>;
};

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
  q?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  categoryIds?: string;
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
