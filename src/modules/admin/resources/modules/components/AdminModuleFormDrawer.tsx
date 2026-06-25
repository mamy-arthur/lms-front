"use client";

import { memo, useEffect, useMemo } from "react";
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

export interface AdminModuleFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  module?: Module;
  duplicateFrom?: Module;
  usedCategoryIds?: Set<string>;
}

function AdminModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module,
  duplicateFrom,
  usedCategoryIds,
}: AdminModuleFormDrawerProps) {
  const isEdit = !!module;
  const isDuplicate = !!duplicateFrom;

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo(() => {
    if (module) {
      return {
        name: module.name,
        identifier: module.identifier,
        description: module.description,
        category: module.category,
        courseIds: module.courseIds,
      };
    }
    if (duplicateFrom) {
      return {
        name: duplicateFrom.name,
        identifier: duplicateFrom.identifier,
        description: duplicateFrom.description,
        category: duplicateFrom.category,
        courseIds: duplicateFrom.courseIds,
      };
    }
    return CREATE_DEFAULTS;
  }, [module, duplicateFrom]);

  const formModule = isDuplicate ? undefined : module;

  const formState = useModuleFormDrawer({
    open,
    onClose,
    onSuccess,
    module: formModule,
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

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  const title = isEdit ? "Modifier le module" : isDuplicate ? "Dupliquer le module" : "Ajouter un module";

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{title}</SheetTitle>
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

export const AdminModuleFormDrawer = memo(AdminModuleFormDrawerBase);
