import type { ApiEnrollmentHistoryWithLearner } from '@/shared/types/enrollment.types';
import type { ApiGroup } from '@/shared/types/group.types';
import type {
  ApiPurchasedLearningPath,
  ApiPurchasedLearningPathLearner,
} from '@/shared/types/purchased-learning-path.types';
import type {
  AssignableGroup,
  PurchasedLearningPath,
  PurchasedLearningPathEnrollment,
  PurchasedLearningPathLearner,
} from '../types';

/** Mappe une ressource API vers le modèle UI purchasedLearningPath. */
export function mapToPurchasedLearningPath(api: ApiPurchasedLearningPath): PurchasedLearningPath {
  return {
    id: api.id,
    learningPathId: api.learning_path.id,
    name: api.learning_path.name,
    imageUrl: api.learning_path.image?.url ?? null,
    creditsTotal: api.purchased,
    creditsUsed: api.used,
    creditsAvailable: api.credits_available,
    enrollmentsNotStartedCount: api.enrollments_not_started_count,
    enrollmentsInProgressCount: api.enrollments_in_progress_count,
    enrollmentsCompletedCount: api.enrollments_completed_count,
    enrollmentsExpiredCount: api.enrollments_expired_count,
  };
}

export function mapLearnerToRow(
  learner: ApiPurchasedLearningPathLearner,
): PurchasedLearningPathLearner {
  return {
    id: learner.id,
    fullName: `${learner.first_name} ${learner.last_name}`.trim() || learner.id,
    email: learner.email,
    avatarUrl: learner.profile_photo?.url ?? null,
    enrollment: learner.enrollment
      ? {
          id: learner.enrollment.id,
          status: learner.enrollment.status,
          enrolledAt: learner.enrollment.enrolled_at,
        }
      : null,
  };
}

export function mapApiGroupToAssignable(group: ApiGroup): AssignableGroup {
  return {
    id: group.id,
    tenantId: group.tenant_id,
    name: group.name,
    userIds: group.members.map((member) => member.trainee_id),
  };
}

export function mapEnrollmentHistoryToRow(
  enrollment: ApiEnrollmentHistoryWithLearner,
): PurchasedLearningPathEnrollment {
  const fullName = enrollment.learner
    ? `${enrollment.learner.first_name} ${enrollment.learner.last_name}`.trim()
    : enrollment.learner_id;
  return {
    id: enrollment.id,
    userId: enrollment.learner_id,
    fullName,
    email: enrollment.learner?.email ?? null,
    avatarUrl: enrollment.learner?.profile_photo?.url ?? null,
    enrolledAt: enrollment.enrolled_at,
    startedAt: enrollment.started_at,
    completedAt: enrollment.completed_at,
  };
}
