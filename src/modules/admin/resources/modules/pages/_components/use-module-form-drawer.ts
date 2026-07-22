import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { z } from 'zod';
import type { MutationLike } from '@/shared/types/mutation';
import { useFormDrawer as _useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { useAvailableCoursesQuery } from '../../hooks/useAvailableCoursesQuery';
import { useCategoryData } from '@/modules/shared/components/courses/hooks/useCategoryData';

export type { MutationLike };

export interface ModuleFormModule {
  id: string;
  shortname: string;
  idnumber: string;
  description: string;
  courseIds: string[];
}

export function useModuleFormDrawer({
  open,
  onClose,
  onSuccess,
  module,
  createMutation,
  updateMutation,
  schema,
  defaultValues,
  createDefaults,
  buildCreatePayload,
  buildUpdatePayload,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  module?: ModuleFormModule;
  createMutation: MutationLike;
  updateMutation: MutationLike;
  schema: z.ZodTypeAny;
  defaultValues: FieldValues;
  createDefaults: FieldValues;
  buildCreatePayload: (values: FieldValues) => unknown;
  buildUpdatePayload: (values: FieldValues, id: string) => unknown;
}) {
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);

  const base = _useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: module,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults,
    buildCreatePayload,
    buildUpdatePayload,
  });

  const selectedCourseIds = useWatch({
    control: base.form.control,
    name: 'courseIds',
  }) as unknown as string[];

  const toggleCourse = useCallback(
    (courseId: string) => {
      const current = base.form.getValues('courseIds') as unknown as string[];
      const next = current.includes(courseId)
        ? current.filter((id: string) => id !== courseId)
        : [...current, courseId];
      base.form.setValue('courseIds', next, { shouldValidate: true });
    },
    [base.form],
  );

  // Use real available courses from the backend API.
  // In edit mode, pass the module ID so already-linked courses are included.
  const { data: availableCourses = [] } = useAvailableCoursesQuery(module?.id);
  const { categoriesQuery } = useCategoryData();
  const courseCategories = categoriesQuery.data ?? [];

  const coursesByCategory = useMemo(() => {
    const categoryNameById = new Map(courseCategories.map((c) => [c.id, c.name]));
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        courses: Array<{ id: string; fullName: string; categoryId: string }>;
      }
    >();
    for (const course of availableCourses) {
      const key = course.categoryId || '__uncategorized__';
      if (!map.has(key)) {
        const name =
          course.categoryName || categoryNameById.get(course.categoryId) || 'Sans catégorie';
        map.set(key, { key, name, courses: [] });
      }
      map.get(key)!.courses.push({
        id: course.id,
        fullName: course.fullName,
        categoryId: course.categoryId,
      });
    }
    return Array.from(map.values());
  }, [availableCourses, courseCategories]);

  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (coursesByCategory.length > 0 && openCategories.size === 0) {
      setOpenCategories(new Set(coursesByCategory.map(({ key }) => key)));
    }
  }, [coursesByCategory]);

  const toggleCategory = useCallback((key: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const shortname = useWatch({
    control: base.form.control,
    name: 'shortname',
  }) as unknown as string;

  return {
    ...base,
    selectedCourseIds,
    toggleCourse,
    coursesByCategory,
    openCategories,
    toggleCategory,
    shortname,
    coursePopoverOpen,
    setCoursePopoverOpen,
  };
}
