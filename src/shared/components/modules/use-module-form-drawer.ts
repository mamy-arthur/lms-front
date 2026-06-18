import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues } from "react-hook-form";
import type { z } from "zod";
import {
  MOCK_COURSE_CATEGORIES,
  MOCK_COURSES,
} from "@/shared/mocks/courses.mock";

export interface MutationLike {
  mutate: (...args: any[]) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

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
  module: mod,
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
  const isEdit = !!mod;

  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleClose = useCallback(() => {
    form.reset(createDefaults);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }, [form, createMutation, updateMutation, onClose, createDefaults]);

  const selectedCourseIds = form.watch("courseIds") as unknown as string[];

  const toggleCourse = useCallback(
    (courseId: string) => {
      const current = form.getValues("courseIds") as unknown as string[];
      const next = current.includes(courseId)
        ? current.filter((id: string) => id !== courseId)
        : [...current, courseId];
      form.setValue("courseIds", next, { shouldValidate: true });
    },
    [form],
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

  const name = form.watch("name") as unknown as string;

  const onSubmit = useCallback(
    (values: FieldValues) => {
      if (isEdit && mod) {
        updateMutation.mutate(
          buildUpdatePayload(values, mod.id),
          {
            onSuccess: () => {
              form.reset();
              createMutation.reset();
              updateMutation.reset();
              onSuccess?.();
            },
          },
        );
      } else {
        createMutation.mutate(
          buildCreatePayload(values),
          {
            onSuccess: () => {
              form.reset();
              createMutation.reset();
              updateMutation.reset();
              onSuccess?.();
            },
          },
        );
      }
    },
    [isEdit, mod, createMutation, updateMutation, form, onSuccess, buildCreatePayload, buildUpdatePayload],
  );

  return {
    form,
    handleClose,
    selectedCourseIds,
    toggleCourse,
    coursesByCategory,
    openCategories,
    toggleCategory,
    name,
    onSubmit,
    mutation,
    isEdit,
    coursePopoverOpen,
    setCoursePopoverOpen,
  };
}
