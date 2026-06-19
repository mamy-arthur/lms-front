import { useCallback, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { z } from "zod";
import {
  MOCK_COURSE_CATEGORIES,
  MOCK_COURSES,
} from "@/shared/mocks/courses.mock";
import type { MutationLike } from "@/shared/types/mutation";
import { useFormDrawer as _useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";

export type { MutationLike };

export interface ModuleFormModule {
  id: string;
  name: string;
  identifier: string;
  description: string;
  category: string;
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
  schema: z.ZodSchema<any>;
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
    name: "courseIds",
  }) as unknown as string[];

  const toggleCourse = useCallback(
    (courseId: string) => {
      const current = base.form.getValues("courseIds") as unknown as string[];
      const next = current.includes(courseId)
        ? current.filter((id: string) => id !== courseId)
        : [...current, courseId];
      base.form.setValue("courseIds", next, { shouldValidate: true });
    },
    [base.form],
  );

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, { name: string; courses: typeof MOCK_COURSES }>();
    for (const cat of MOCK_COURSE_CATEGORIES) {
      map.set(cat.id, { name: cat.name, courses: [] });
    }
    for (const course of MOCK_COURSES) {
      const group = map.get(course.categoryId);
      if (group) group.courses.push(course);
    }
    return Array.from(map.values());
  }, []);

  const [openCategories, setOpenCategories] = useState(() =>
    new Set(coursesByCategory.map(({ name }) => name)),
  );

  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const name = useWatch({
    control: base.form.control,
    name: "name",
  }) as unknown as string;

  return {
    ...base,
    selectedCourseIds,
    toggleCourse,
    coursesByCategory,
    openCategories,
    toggleCategory,
    name,
    coursePopoverOpen,
    setCoursePopoverOpen,
  };
}
