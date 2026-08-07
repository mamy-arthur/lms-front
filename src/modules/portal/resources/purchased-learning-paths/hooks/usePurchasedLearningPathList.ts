import { useMemo, useState } from "react";
import type {
  AssignableGroup,
  PurchasedLearningPathRow,
  PurchasedLearningPathStatKey,
} from "../types";
import { useAssignableTraineesQuery } from "./useAssignableTraineesQuery";
import { useCreateEnrollments } from "./useCreateEnrollments";
import { useCreateGroupWithMembers } from "./useCreateGroupWithMembers";
import { useDeleteGroup } from "./useDeleteGroup";
import { useGroupsQuery } from "./useGroupsQuery";
import { usePurchasedLearningPathsController } from "./usePurchasedLearningPathsController";
import { usePurchasedLearningPathsQuery } from "./usePurchasedLearningPathsQuery";
import { useUpdateGroupWithMembers } from "./useUpdateGroupWithMembers";

interface SortState {
  column: "name";
  direction: "asc" | "desc";
}

export function usePurchasedLearningPathList() {
  const [sort, setSort] = useState<SortState>({
    column: "name",
    direction: "asc",
  });
  /** Index 0-based pour DataTable ; l’API purchased-learning-paths attend page 1-based. */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [statsDrawer, setStatsDrawer] = useState<{
    purchasedLearningPath: PurchasedLearningPathRow | null;
    stat: PurchasedLearningPathStatKey;
  }>({
    purchasedLearningPath: null,
    stat: "cumulative",
  });

  const [assignmentTarget, setAssignmentTarget] =
    useState<PurchasedLearningPathRow | null>(null);

  const { data, isLoading } = usePurchasedLearningPathsQuery({
    page: page + 1,
    perPage: pageSize,
  });
  const { data: trainees = [] } = useAssignableTraineesQuery();
  const { data: groups = [] } = useGroupsQuery();

  const createGroupMutation = useCreateGroupWithMembers();
  const updateGroupMutation = useUpdateGroupWithMembers();
  const deleteGroupMutation = useDeleteGroup();
  const createEnrollmentsMutation = useCreateEnrollments();

  const controller = usePurchasedLearningPathsController({
    purchasedLearningPaths: data?.purchasedLearningPaths ?? [],
  });

  const sortedRows = useMemo(() => {
    const rows = [...controller.purchasedLearningPathRows];

    rows.sort((a, b) => {
      const compareResult = a.name.localeCompare(b.name);
      return sort.direction === "asc" ? compareResult : -compareResult;
    });

    return rows;
  }, [controller.purchasedLearningPathRows, sort]);

  const assignmentTargetRow = useMemo(() => {
    if (!assignmentTarget) return null;
    return (
      sortedRows.find((row) => row.id === assignmentTarget.id) ??
      controller.purchasedLearningPathRows.find(
        (row) => row.id === assignmentTarget.id,
      ) ??
      assignmentTarget
    );
  }, [assignmentTarget, controller.purchasedLearningPathRows, sortedRows]);

  const handleSort = (column: string) => {
    if (column !== "name") return;

    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
    setPage(0);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  const handleCreateGroup = (name: string, traineeIds: string[]) =>
    createGroupMutation.mutateAsync({ name, traineeIds });

  const handleEditGroup = (
    group: AssignableGroup,
    name: string,
    traineeIds: string[],
  ) =>
    updateGroupMutation.mutateAsync({
      id: group.id,
      name,
      traineeIds,
      previousName: group.name,
      previousTraineeIds: group.userIds,
    });

  return {
    sort,
    page,
    pageSize,
    total: data?.meta.total ?? 0,
    isLoading,
    sortedRows,
    statsDrawer,
    assignmentTargetRow,
    trainees,
    groups,
    setPage,
    setStatsDrawer,
    setAssignmentTarget,
    handleSort,
    handlePageSizeChange,
    handleCreateGroup,
    handleEditGroup,
    handleDeleteGroup: (groupId: string) =>
      deleteGroupMutation.mutateAsync(groupId),
    handleAssign: createEnrollmentsMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
    isAssigning: createEnrollmentsMutation.isPending,
  } as const;
}
