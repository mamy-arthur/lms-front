import { useCallback, useEffect, useMemo, useState } from 'react';
import { convertMonthsToDays } from '../data/formations.mock';
import type {
  AssignFormationToGroupPayload,
  AssignFormationToUsersPayload,
  CreateFormationGroupPayload,
  FormationEnrollment,
  FormationGroup,
  FormationStatKey,
  FormationStats,
  PurchasedFormation,
  PurchasedFormationRow,
  TenantAssignableUser,
} from '../types';

function isCurrentMonth(dateIso: string) {
  const now = new Date();
  const date = new Date(dateIso);
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function buildFormationStats(formation: PurchasedFormation): FormationStats {
  const cumulative = formation.enrollments.length;
  const month = formation.enrollments.filter((enrollment) =>
    isCurrentMonth(enrollment.enrolledAt),
  ).length;
  const inProgress = formation.enrollments.filter(
    (enrollment) => enrollment.startedAt !== null && enrollment.completedAt === null,
  ).length;
  const notStarted = formation.enrollments.filter(
    (enrollment) => enrollment.startedAt === null,
  ).length;
  const active = inProgress + notStarted;

  return {
    cumulative,
    month,
    inProgress,
    notStarted,
    availableCredits: Math.max(0, formation.purchasedCredits - active),
  };
}

export function filterEnrollmentsByStat(formation: PurchasedFormation, stat: FormationStatKey) {
  switch (stat) {
    case 'month':
      return formation.enrollments.filter((enrollment) => isCurrentMonth(enrollment.enrolledAt));
    case 'inProgress':
      return formation.enrollments.filter(
        (enrollment) => enrollment.startedAt !== null && enrollment.completedAt === null,
      );
    case 'notStarted':
      return formation.enrollments.filter((enrollment) => enrollment.startedAt === null);
    case 'cumulative':
    default:
      return formation.enrollments;
  }
}

function createEnrollmentId(formationId: string, userId: string) {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}`;

  return `enrollment-${formationId}-${userId}-${suffix}`;
}

function buildNewEnrollment(
  formation: PurchasedFormation,
  user: TenantAssignableUser,
  durationMonths: number,
  groupName: string | null,
): FormationEnrollment {
  return {
    id: createEnrollmentId(formation.id, user.id),
    userId: user.id,
    fullName: user.fullName,
    enrolledAt: new Date().toISOString(),
    groupName,
    startedAt: null,
    completedAt: null,
    plannedDurationDays: convertMonthsToDays(durationMonths),
    actualDurationDays: null,
  };
}

interface UseFormationManagementControllerInput {
  formations: PurchasedFormation[];
  groups: FormationGroup[];
  users: TenantAssignableUser[];
}

export function useFormationManagementController({
  formations: initialFormations,
  groups: initialGroups,
  users,
}: UseFormationManagementControllerInput) {
  const [formations, setFormations] = useState<PurchasedFormation[]>(initialFormations);
  const [groups, setGroups] = useState<FormationGroup[]>(initialGroups);

  useEffect(() => {
    setFormations(initialFormations);
  }, [initialFormations]);

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

  const formationRows = useMemo<PurchasedFormationRow[]>(() => {
    return formations.map((formation) => ({
      ...formation,
      stats: buildFormationStats(formation),
    }));
  }, [formations]);

  const updateFormationDuration = useCallback((formationId: string, durationMonths: number) => {
    setFormations((current) =>
      current.map((formation) =>
        formation.id === formationId
          ? {
              ...formation,
              durationMonths,
              durationDays: convertMonthsToDays(durationMonths),
            }
          : formation,
      ),
    );
  }, []);

  const assignToUsers = useCallback(
    ({ formationId, userIds, durationMonths }: AssignFormationToUsersPayload) => {
      let assignedCount = 0;

      setFormations((current) =>
        current.map((formation) => {
          if (formation.id !== formationId) {
            return formation;
          }

          const existingUserIds = new Set(
            formation.enrollments.map((enrollment) => enrollment.userId),
          );

          const newEnrollments = userIds
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId) => usersById.get(userId))
            .filter((user): user is TenantAssignableUser => Boolean(user))
            .map((user) => buildNewEnrollment(formation, user, durationMonths, null));

          assignedCount = newEnrollments.length;

          if (newEnrollments.length === 0) {
            return formation;
          }

          return {
            ...formation,
            durationMonths,
            durationDays: convertMonthsToDays(durationMonths),
            enrollments: [...formation.enrollments, ...newEnrollments],
          };
        }),
      );

      return assignedCount;
    },
    [usersById],
  );

  const assignToGroup = useCallback(
    ({ formationId, groupId, durationMonths }: AssignFormationToGroupPayload) => {
      const group = groups.find((item) => item.id === groupId);

      if (!group) {
        return 0;
      }

      let assignedCount = 0;

      setFormations((current) =>
        current.map((formation) => {
          if (formation.id !== formationId) {
            return formation;
          }

          const existingUserIds = new Set(
            formation.enrollments.map((enrollment) => enrollment.userId),
          );

          const newEnrollments = group.userIds
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId) => usersById.get(userId))
            .filter((user): user is TenantAssignableUser => Boolean(user))
            .map((user) => buildNewEnrollment(formation, user, durationMonths, group.name));

          assignedCount = newEnrollments.length;

          if (newEnrollments.length === 0) {
            return formation;
          }

          return {
            ...formation,
            durationMonths,
            durationDays: convertMonthsToDays(durationMonths),
            enrollments: [...formation.enrollments, ...newEnrollments],
          };
        }),
      );

      return assignedCount;
    },
    [groups, usersById],
  );

  const removeEnrollment = useCallback((formationId: string, userId: string) => {
    setFormations((current) =>
      current.map((formation) =>
        formation.id !== formationId
          ? formation
          : {
              ...formation,
              enrollments: formation.enrollments.filter((e) => e.userId !== userId),
            },
      ),
    );
  }, []);

  const createGroup = useCallback(({ tenantId, name, userIds }: CreateFormationGroupPayload) => {
    const group: FormationGroup = {
      id: `group-${Date.now()}`,
      tenantId,
      name,
      userIds,
    };

    setGroups((current) => [group, ...current]);

    return group;
  }, []);

  return {
    formationRows,
    groups,
    users,
    updateFormationDuration,
    removeEnrollment,
    assignToUsers,
    assignToGroup,
    createGroup,
  } as const;
}
