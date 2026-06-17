"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import { Sheet } from "@/components/ui/sheet";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ModuleFormDrawerContent,
} from "@/shared/components/modules/module-form-drawer-content";
import {
  extractApiError,
  genIdentifier,
} from "@/shared/components/modules/module-form-utils";
import { useModuleFormDrawer } from "@/shared/components/modules/use-module-form-drawer";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreateModule } from "../../hooks/useCreateModule";
import { useUpdateModule } from "../../hooks/useUpdateModule";
import type { CreateModulePayload, Module, UpdateModulePayload } from "../../types";

const createSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  courseIds: z.array(z.string()).min(0),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  courseIds: z.array(z.string()).min(0),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  name: "",
  identifier: "",
  description: "",
  category: "",
  tenant_id: "",
  courseIds: [],
};

export interface AdminModuleFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  module?: Module;
  tenants: Tenant[];
}

function AdminModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module: mod,
  tenants,
}: AdminModuleFormDrawerProps) {
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
        tenant_id: mod.tenantId,
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
        tenant_id: values.tenant_id,
        course_ids: values.courseIds,
      }) as CreateModulePayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        name: values.name,
        identifier: values.identifier,
        description: values.description ?? "",
        category: values.category,
        tenant_id: values.tenant_id,
        course_ids: values.courseIds,
      } as UpdateModulePayload,
    }),
  });

  const tenantField = (
    <FieldRoot
      control={formState.form.control as any}
      name="tenant_id"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel>Tenant</FieldLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FieldContent>
              <SelectTrigger
                size="default"
                aria-label="Tenant"
                className="w-full"
              >
                <SelectValue placeholder="Sélectionner un tenant" />
              </SelectTrigger>
            </FieldContent>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError />
        </FieldGroup>
      )}
    />
  );

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
        extraFields={tenantField}
      />
    </Sheet>
  );
}

export const AdminModuleFormDrawer = memo(AdminModuleFormDrawerBase);
