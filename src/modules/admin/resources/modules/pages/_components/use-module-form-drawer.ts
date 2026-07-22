import { useCallback, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { z } from 'zod';
import type { MutationLike } from '@/shared/types/mutation';
import { useFormDrawer as _useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { useAvailableCoursesQuery } from '../../hooks/useAvailableCoursesQuery';

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

  const coursesByCategory = useMemo(() => {
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
        map.set(key, { key, name: course.categoryName || 'Sans catégorie', courses: [] });
      }
      map.get(key)!.courses.push({
        id: course.id,
        fullName: course.fullName,
        categoryId: course.categoryId,
      });
    }
    return Array.from(map.values());
  }, [availableCourses]);

  // All category names (used to expand all by default once data loads)
  const allCategoryNames = useMemo(
    () => new Set(coursesByCategory.map(({ name }) => name)),
    [coursesByCategory],
  );

  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());

  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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
    // Expand all categories by default when there are no explicit toggles yet
    openCategories: openCategories.size > 0 ? openCategories : allCategoryNames,
    toggleCategory,
    shortname,
    coursePopoverOpen,
    setCoursePopoverOpen,
  };
}
