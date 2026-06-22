"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ModuleForm } from "./module-form";
import { genIdentifier } from "./module-form-utils";
import { useModuleFormDrawer } from "./use-module-form-drawer";
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
  usedCategoryIds?: Set<string>;
}

function ModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module: mod,
  usedCategoryIds,
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
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{isEdit ? "Modifier le module" : "Ajouter un module"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations pour le module.
          </SheetDescription>
        </SheetHeader>
        <ModuleForm
          form={formState.form}
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
          genIdentifierFn={genIdentifier}
          usedCategoryIds={usedCategoryIds}
        />
      </SheetContent>
    </Sheet>
  );
}

export const ModuleFormDrawer = memo(ModuleFormDrawerBase);
