import { useCallback } from 'react';
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

  const addCourseIds = useCallback(
    (newIds: string[]) => {
      const current = base.form.getValues('courseIds') as unknown as string[];
      const merged = [...current, ...newIds.filter((id) => !current.includes(id))];
      base.form.setValue('courseIds', merged, { shouldValidate: true });
    },
    [base.form],
  );

  // In edit mode, pass the module ID so the backend marks its own courses as AVAILABLE.
  const { data: availableCourses = [], isLoading: isLoadingCourses } = useAvailableCoursesQuery(
    module?.id,
  );

  return {
    ...base,
    selectedCourseIds,
    toggleCourse,
    addCourseIds,
    availableCourses,
    isLoadingCourses,
  };
}
