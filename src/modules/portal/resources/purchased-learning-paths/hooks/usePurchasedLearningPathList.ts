import { useMemo, useState } from 'react';
import type { DataTableSort } from '@/shared/components/ui/DataTable';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type {
  AssignableGroup,
  PurchasedLearningPathRow,
  PurchasedLearningPathStatKey,
} from '../types';
import { useCreateEnrollments } from './useCreateEnrollments';
import { useCreateGroupWithMembers } from './useCreateGroupWithMembers';
import { useDeleteGroup } from './useDeleteGroup';
import { useGroupsQuery } from './useGroupsQuery';
import { usePurchasedLearningPathCategoriesQuery } from './usePurchasedLearningPathCategoriesQuery';
import { usePurchasedLearningPathsController } from './usePurchasedLearningPathsController';
import { usePurchasedLearningPathsQuery } from './usePurchasedLearningPathsQuery';
import { useUpdateGroupWithMembers } from './useUpdateGroupWithMembers';

export function usePurchasedLearningPathList() {
  /** Index 0-based pour DataTable ; l’API purchased-learning-paths attend page 1-based. */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DataTableSort | undefined>(undefined);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 400);
  const [statsDrawer, setStatsDrawer] = useState<{
    purchasedLearningPath: PurchasedLearningPathRow | null;
    stat: PurchasedLearningPathStatKey;
  }>({
    purchasedLearningPath: null,
    stat: 'cumulative',
  });

  const [assignmentTarget, setAssignmentTarget] = useState<PurchasedLearningPathRow | null>(null);

  // name/category/credits_available are sorted server-side; stats are client-side
  const SERVER_SORT_MAP: Record<string, string> = {
    name: 'name',
    category: 'category_name',
    availableCredits: 'credits_available',
  };
  const isServerSort = !!(sort && sort.column in SERVER_SORT_MAP);

  const { data, isLoading } = usePurchasedLearningPathsQuery({
    page: page + 1,
    perPage: pageSize,
    q: debouncedSearch || undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds.join(',') : undefined,
    sortBy: isServerSort && sort ? SERVER_SORT_MAP[sort.column] : undefined,
    sortDir: isServerSort && sort ? sort.direction : undefined,
  });

  const { data: categoriesData } = usePurchasedLearningPathCategoriesQuery();
  const availableCategories = categoriesData ?? [];

  const { data: groups = [] } = useGroupsQuery(Boolean(assignmentTarget));

  const createGroupMutation = useCreateGroupWithMembers();
  const updateGroupMutation = useUpdateGroupWithMembers();
  const deleteGroupMutation = useDeleteGroup();
  const createEnrollmentsMutation = useCreateEnrollments();

  const controller = usePurchasedLearningPathsController({
    purchasedLearningPaths: data?.purchasedLearningPaths ?? [],
  });

  const sortedRows = useMemo(() => {
    const rows = [...controller.purchasedLearningPathRows];
    if (!sort || isServerSort) return rows;
    return rows.sort((a, b) => {
      let cmp = 0;
      switch (sort.column) {
        case 'cumulative':
          cmp = a.stats.cumulative - b.stats.cumulative;
          break;
        case 'inProgress':
          cmp = a.stats.inProgress - b.stats.inProgress;
          break;
        case 'notStarted':
          cmp = a.stats.notStarted - b.stats.notStarted;
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [controller.purchasedLearningPathRows, sort, isServerSort]);

  const assignmentTargetRow = useMemo(() => {
    if (!assignmentTarget) return null;
    return (
      sortedRows.find((row) => row.id === assignmentTarget.id) ??
      controller.purchasedLearningPathRows.find((row) => row.id === assignmentTarget.id) ??
      assignmentTarget
    );
  }, [assignmentTarget, controller.purchasedLearningPathRows, sortedRows]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(0);
  };

  const handleCategoryToggle = (id: string) => {
    setCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      setPage(0);
      return next;
    });
  };

  const handleSort = (column: string) => {
    setSort((prev) => {
      if (prev?.column === column) {
        return prev.direction === 'asc' ? { column, direction: 'desc' } : undefined;
      }
      return { column, direction: 'asc' };
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  const handleCreateGroup = (name: string, traineeIds: string[]) =>
    createGroupMutation.mutateAsync({ name, traineeIds });

  const handleEditGroup = (group: AssignableGroup, name: string, traineeIds: string[]) =>
    updateGroupMutation.mutateAsync({
      id: group.id,
      name,
      traineeIds,
      previousName: group.name,
      previousTraineeIds: group.userIds,
    });

  return {
    page,
    pageSize,
    total: data?.meta.total ?? 0,
    isLoading,
    search,
    sort,
    categoryIds,
    availableCategories,
    sortedRows,
    statsDrawer,
    assignmentTargetRow,
    groups,
    setPage,
    setStatsDrawer,
    setAssignmentTarget,
    handleSearchChange,
    handleCategoryToggle,
    handleSort,
    handlePageSizeChange,
    handleCreateGroup,
    handleEditGroup,
    handleDeleteGroup: (groupId: string) => deleteGroupMutation.mutateAsync(groupId),
    handleAssign: createEnrollmentsMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
    isDeletingGroup: deleteGroupMutation.isPending,
    isAssigning: createEnrollmentsMutation.isPending,
  } as const;
}
