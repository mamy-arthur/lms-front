"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import { Sheet } from "@/components/ui/sheet";
import {
  ModuleFormDrawerContent,
} from "@/shared/components/modules/module-form-drawer-content";
import {
  extractApiError,
  genIdentifier,
} from "@/shared/components/modules/module-form-utils";
import { useModuleFormDrawer } from "@/shared/components/modules/use-module-form-drawer";
import { useCreateModule } from "../hooks/useCreateModule";
import { useUpdateModule } from "../hooks/useUpdateModule";
import type { CreateModulePayload, Module, UpdateModulePayload } from "../types";

const createSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  courseIds: z.array(z.string()).min(0),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  courseIds: z.array(z.string()).min(0),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  name: "",
  identifier: "",
  description: "",
  category: "",
  courseIds: [],
};

export interface ModuleFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  module?: Module;
}

function ModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module: mod,
}: ModuleFormDrawerProps) {
  const isEdit = !!mod;

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo(() => {
    if (mod) {
      return {
        name: mod.name,
        identifier: mod.identifier,
        description: mod.description,
        category: mod.category,
        courseIds: mod.courseIds,
      };
    }
    return CREATE_DEFAULTS;
  }, [mod]);

  const formState = useModuleFormDrawer({
    open,
    onClose,
    onSuccess,
    module: mod,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        ...values,
        description: values.description ?? "",
        course_ids: values.courseIds,
      }) as CreateModulePayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        name: values.name,
        identifier: values.identifier,
        description: values.description ?? "",
        category: values.category,
        course_ids: values.courseIds,
      } as UpdateModulePayload,
    }),
  });

  return (
    <Sheet open={open}>
      <ModuleFormDrawerContent
        form={formState.form}
        open={open}
        onClose={onClose}
        mutation={formState.mutation}
        isEdit={formState.isEdit}
        handleClose={formState.handleClose}
        onSubmit={formState.onSubmit}
        selectedCourseIds={formState.selectedCourseIds}
        toggleCourse={formState.toggleCourse}
        coursesByCategory={formState.coursesByCategory}
        openCategories={formState.openCategories}
        toggleCategory={formState.toggleCategory}
        name={formState.name}
        coursePopoverOpen={formState.coursePopoverOpen}
        setCoursePopoverOpen={formState.setCoursePopoverOpen}
        title={isEdit ? "Modifier le module" : "Ajouter un module"}
        genIdentifierFn={genIdentifier}
        extractApiErrorFn={extractApiError}
      />
    </Sheet>
  );
}

export const ModuleFormDrawer = memo(ModuleFormDrawerBase);
