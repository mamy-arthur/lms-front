import { useMemo } from 'react';
import type { ApiAssignment } from '@/shared/types/assignment.types';
import { mapAssignmentToEnrollment } from '../lib/mappers';
import type {
  PurchasedLearningPath,
  PurchasedLearningPathEnrollment,
  PurchasedLearningPathRow,
  PurchasedLearningPathStatKey,
  PurchasedLearningPathStats,
  TenantAssignableUser,
} from '../types';

function isCurrentMonth(dateIso: string) {
  const now = new Date();
  const date = new Date(dateIso);
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function buildPurchasedLearningPathStats(
  purchasedLearningPath: PurchasedLearningPath,
): PurchasedLearningPathStats {
  const cumulative = purchasedLearningPath.enrollments.length;
  const month = purchasedLearningPath.enrollments.filter((enrollment) =>
    isCurrentMonth(enrollment.enrolledAt),
  ).length;
  const inProgress = purchasedLearningPath.enrollments.filter(
    (enrollment) => enrollment.startedAt !== null && enrollment.completedAt === null,
  ).length;
  const notStarted = purchasedLearningPath.enrollments.filter(
    (enrollment) => enrollment.startedAt === null,
  ).length;
  const active = inProgress + notStarted;

  return {
    cumulative,
    month,
    inProgress,
    notStarted,
    availableCredits: Math.max(0, purchasedLearningPath.purchasedCredits - active),
  };
}

export function filterEnrollmentsByStat(
  purchasedLearningPath: PurchasedLearningPath,
  stat: PurchasedLearningPathStatKey,
) {
  switch (stat) {
    case 'month':
      return purchasedLearningPath.enrollments.filter((enrollment) =>
        isCurrentMonth(enrollment.enrolledAt),
      );
    case 'inProgress':
      return purchasedLearningPath.enrollments.filter(
        (enrollment) => enrollment.startedAt !== null && enrollment.completedAt === null,
      );
    case 'notStarted':
      return purchasedLearningPath.enrollments.filter(
        (enrollment) => enrollment.startedAt === null,
      );
    case 'cumulative':
    default:
      return purchasedLearningPath.enrollments;
  }
}

interface UsePurchasedLearningPathsControllerInput {
  purchasedLearningPaths: PurchasedLearningPath[];
  assignments: ApiAssignment[];
  users: TenantAssignableUser[];
}

export function usePurchasedLearningPathsController({
  purchasedLearningPaths,
  assignments,
  users,
}: UsePurchasedLearningPathsControllerInput) {
  const usersById = useMemo(() => {
    const map = new Map<string, TenantAssignableUser>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  const purchasedLearningPathRows = useMemo<PurchasedLearningPathRow[]>(() => {
    const enrollmentsByLearningPathId = new Map<string, PurchasedLearningPathEnrollment[]>();

    for (const assignment of assignments) {
      const enrollment = mapAssignmentToEnrollment(assignment, usersById);
      const existing = enrollmentsByLearningPathId.get(assignment.learning_path_id) ?? [];
      existing.push(enrollment);
      enrollmentsByLearningPathId.set(assignment.learning_path_id, existing);
    }

    return purchasedLearningPaths.map((purchasedLearningPath) => {
      const withEnrollments: PurchasedLearningPath = {
        ...purchasedLearningPath,
        enrollments: enrollmentsByLearningPathId.get(purchasedLearningPath.learningPathId) ?? [],
      };

      return {
        ...withEnrollments,
        stats: buildPurchasedLearningPathStats(withEnrollments),
      };
    });
  }, [assignments, purchasedLearningPaths, usersById]);

  return {
    purchasedLearningPathRows,
    users,
  } as const;
}
