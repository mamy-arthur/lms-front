import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { z } from 'zod';
import type { MutationLike } from '@/shared/types/mutation';
import { useFormDrawer as _useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { useCoursesByIds } from '@/modules/shared/components/courses/hooks/useCoursesByIds';
import type { Course } from '@/modules/shared/components/courses/types';

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

  const [pickedCourses, setPickedCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!open) setPickedCourses([]);
  }, [open]);

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

  const addCourses = useCallback(
    (courses: Course[]) => {
      const current = base.form.getValues('courseIds') as unknown as string[];
      const added = courses.filter((course) => !current.includes(course.id));
      setPickedCourses((prev) => [...prev, ...added]);
      base.form.setValue('courseIds', [...current, ...added.map((c) => c.id)], {
        shouldValidate: true,
      });
    },
    [base.form],
  );

  const { data: persistedCourses = [] } = useCoursesByIds(selectedCourseIds);

  // Courses picked in the dialog are kept locally so their name shows up
  // immediately, before the by-ids query has caught up with the new selection.
  const selectedCourses = useMemo(() => {
    const byId = new Map<string, Course>();
    for (const course of [...pickedCourses, ...persistedCourses]) {
      byId.set(course.id, course);
    }
    return selectedCourseIds.flatMap((id) => {
      const course = byId.get(id);
      return course ? [course] : [];
    });
  }, [pickedCourses, persistedCourses, selectedCourseIds]);

  return {
    ...base,
    selectedCourseIds,
    toggleCourse,
    addCourses,
    selectedCourses,
  };
}
