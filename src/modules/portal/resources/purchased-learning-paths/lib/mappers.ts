import type { ApiAssignment } from '@/shared/types/assignment.types';
import type { ApiGroup } from '@/shared/types/group.types';
import type { ApiPurchasedLearningPath } from '@/shared/types/purchased-learning-path.types';
import type { ApiAssignableTraineeUser } from '@/shared/types/user.types';
import type {
  AssignableGroup,
  PurchasedLearningPath,
  PurchasedLearningPathEnrollment,
  TenantAssignableUser,
} from '../types';

/** Mappe une ressource API vers le modèle UI purchasedLearningPath. */
export function mapToPurchasedLearningPath(api: ApiPurchasedLearningPath): PurchasedLearningPath {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    learningPathId: api.learning_path.id,
    name: api.learning_path.name,
    purchasedCredits: api.purchased,
    enrollments: [],
  };
}

export function mapToAssignableUser(
  user: ApiAssignableTraineeUser,
  tenantId: string,
): TenantAssignableUser {
  const fullName =
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.id;

  return {
    id: user.id,
    tenantId,
    fullName,
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

export function mapAssignmentToEnrollment(
  assignment: ApiAssignment,
  usersById: Map<string, TenantAssignableUser>,
): PurchasedLearningPathEnrollment {
  return {
    id: assignment.id,
    userId: assignment.trainee_id,
    fullName: usersById.get(assignment.trainee_id)?.fullName ?? assignment.trainee_id,
    enrolledAt: assignment.assigned_at,
    groupName: null,
    startedAt: null,
    completedAt: null,
    plannedDurationDays: 0,
    actualDurationDays: null,
  };
}
