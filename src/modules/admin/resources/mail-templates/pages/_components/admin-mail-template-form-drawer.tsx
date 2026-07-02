"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";
import { MailTemplateForm } from "@modules/shared/components/mail-templates/mail-template-form";
import { mailTemplateToolbarExtras } from "@modules/shared/components/mail-templates/mail-template-toolbar-extras";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreateMailTemplate } from "../../hooks/useCreateMailTemplate";
import { useUpdateMailTemplate } from "../../hooks/useUpdateMailTemplate";
import type {
  MailTemplate,
  CreateMailTemplatePayload,
  UpdateMailTemplatePayload,
} from "../../types";

const baseSchema = {
  name: z.string().min(1, "Nom requis").max(255),
  subject: z.string().min(1, "Sujet requis").max(255),
  isActive: z.boolean(),
  body: z.string().min(1, "Corps requis"),
  tenantId: z.string().min(1, "Tenant requis"),
};

const createSchema = z.object(baseSchema);
const updateSchema = z.object(baseSchema);

type FormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: FormValues = {
  name: "",
  subject: "",
  isActive: true,
  body: "",
  tenantId: "",
};

export interface AdminMailTemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: MailTemplate;
  tenants: Tenant[];
}

function AdminMailTemplateFormDrawerBase({
  open,
  onClose,
  onSuccess,
  template,
  tenants,
}: AdminMailTemplateFormDrawerProps) {
  const isEdit = !!template;

  const createMutation = useCreateMailTemplate();
  const updateMutation = useUpdateMailTemplate();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo<FormValues>(() => {
    if (template) {
      return {
        name: template.name,
        subject: template.subject,
        isActive: template.isActive,
        body: template.body,
        tenantId: template.tenantId,
      };
    }
    return CREATE_DEFAULTS;
  }, [template]);

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: template,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values): CreateMailTemplatePayload => ({
      name: values.name,
      subject: values.subject,
      is_active: values.isActive,
      body: values.body,
      tenant_id: values.tenantId,
    }),
    buildUpdatePayload: (
      values,
      id,
    ): { id: string; data: UpdateMailTemplatePayload } => ({
      id,
      data: {
        name: values.name,
        subject: values.subject,
        is_active: values.isActive,
        body: values.body,
        tenant_id: values.tenantId,
      },
    }),
  });

  const tenantField = (
    <FieldRoot
      control={formState.form.control as any}
      name="tenantId"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel className="text-xs">Tenant *</FieldLabel>
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
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            {isEdit ? "Modifier le template mail" : "Ajouter un template mail"}
          </SheetTitle>
          <SheetDescription>
            Renseignez les informations du template mail.
          </SheetDescription>
        </SheetHeader>
        <MailTemplateForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          extraFields={tenantField}
          toolbarExtras={mailTemplateToolbarExtras}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminMailTemplateFormDrawer = memo(
  AdminMailTemplateFormDrawerBase,
);
