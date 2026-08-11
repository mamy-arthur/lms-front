import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AssignableGroup,
  AssignPurchasedLearningPathToGroupPayload,
  AssignPurchasedLearningPathToUsersPayload,
  CreateAssignableGroupPayload,
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

function createEnrollmentId(purchasedLearningPathId: string, userId: string) {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}`;

  return `enrollment-${purchasedLearningPathId}-${userId}-${suffix}`;
}

function buildNewEnrollment(
  purchasedLearningPath: PurchasedLearningPath,
  user: TenantAssignableUser,
  groupName: string | null,
): PurchasedLearningPathEnrollment {
  return {
    id: createEnrollmentId(purchasedLearningPath.id, user.id),
    userId: user.id,
    fullName: user.fullName,
    enrolledAt: new Date().toISOString(),
    groupName,
    startedAt: null,
    completedAt: null,
    plannedDurationDays: 0,
    actualDurationDays: null,
  };
}

interface UsePurchasedLearningPathsControllerInput {
  purchasedLearningPaths: PurchasedLearningPath[];
  groups: AssignableGroup[];
  users: TenantAssignableUser[];
}

export function usePurchasedLearningPathsController({
  purchasedLearningPaths: initialPurchasedLearningPaths,
  groups: initialGroups,
  users,
}: UsePurchasedLearningPathsControllerInput) {
  const [purchasedLearningPaths, setPurchasedLearningPaths] = useState<PurchasedLearningPath[]>(
    initialPurchasedLearningPaths,
  );
  const [groups, setGroups] = useState<AssignableGroup[]>(initialGroups);

  useEffect(() => {
    setPurchasedLearningPaths(initialPurchasedLearningPaths);
  }, [initialPurchasedLearningPaths]);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const usersById = useMemo(() => {
    const map = new Map<string, TenantAssignableUser>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  const purchasedLearningPathRows = useMemo<PurchasedLearningPathRow[]>(() => {
    return purchasedLearningPaths.map((purchasedLearningPath) => ({
      ...purchasedLearningPath,
      stats: buildPurchasedLearningPathStats(purchasedLearningPath),
    }));
  }, [purchasedLearningPaths]);

  const assignToUsers = useCallback(
    ({ purchasedLearningPathId, userIds }: AssignPurchasedLearningPathToUsersPayload) => {
      let assignedCount = 0;

      setPurchasedLearningPaths((current) =>
        current.map((purchasedLearningPath) => {
          if (purchasedLearningPath.id !== purchasedLearningPathId) {
            return purchasedLearningPath;
          }

          const existingUserIds = new Set(
            purchasedLearningPath.enrollments.map((enrollment) => enrollment.userId),
          );

          const newEnrollments = userIds
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId) => usersById.get(userId))
            .filter((user): user is TenantAssignableUser => Boolean(user))
            .map((user) => buildNewEnrollment(purchasedLearningPath, user, null));

          assignedCount = newEnrollments.length;

          if (newEnrollments.length === 0) {
            return purchasedLearningPath;
          }

          return {
            ...purchasedLearningPath,
            enrollments: [...purchasedLearningPath.enrollments, ...newEnrollments],
          };
        }),
      );

      return assignedCount;
    },
    [usersById],
  );

  const assignToGroup = useCallback(
    ({ purchasedLearningPathId, groupId }: AssignPurchasedLearningPathToGroupPayload) => {
      const group = groups.find((item) => item.id === groupId);

      if (!group) {
        return 0;
      }

      let assignedCount = 0;

      setPurchasedLearningPaths((current) =>
        current.map((purchasedLearningPath) => {
          if (purchasedLearningPath.id !== purchasedLearningPathId) {
            return purchasedLearningPath;
          }

          const existingUserIds = new Set(
            purchasedLearningPath.enrollments.map((enrollment) => enrollment.userId),
          );

          const newEnrollments = group.userIds
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId) => usersById.get(userId))
            .filter((user): user is TenantAssignableUser => Boolean(user))
            .map((user) => buildNewEnrollment(purchasedLearningPath, user, group.name));

          assignedCount = newEnrollments.length;

          if (newEnrollments.length === 0) {
            return purchasedLearningPath;
          }

          return {
            ...purchasedLearningPath,
            enrollments: [...purchasedLearningPath.enrollments, ...newEnrollments],
          };
        }),
      );

      return assignedCount;
    },
    [groups, usersById],
  );

  const removeEnrollment = useCallback((purchasedLearningPathId: string, userId: string) => {
    setPurchasedLearningPaths((current) =>
      current.map((purchasedLearningPath) =>
        purchasedLearningPath.id !== purchasedLearningPathId
          ? purchasedLearningPath
          : {
              ...purchasedLearningPath,
              enrollments: purchasedLearningPath.enrollments.filter((e) => e.userId !== userId),
            },
      ),
    );
  }, []);

  const createGroup = useCallback(({ tenantId, name, userIds }: CreateAssignableGroupPayload) => {
    const group: AssignableGroup = {
      id: `group-${Date.now()}`,
      tenantId,
      name,
      userIds,
    };

    setGroups((current) => [group, ...current]);

    return group;
  }, []);

  const updateGroup = useCallback(
    ({ id, name, userIds }: { id: string; name: string; userIds: string[] }) => {
      setGroups((current) => current.map((g) => (g.id === id ? { ...g, name, userIds } : g)));
    },
    [],
  );

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((current) => current.filter((g) => g.id !== groupId));
  }, []);

  return {
    purchasedLearningPathRows,
    groups,
    users,
    removeEnrollment,
    assignToUsers,
    assignToGroup,
    createGroup,
    updateGroup,
    deleteGroup,
  } as const;
}
