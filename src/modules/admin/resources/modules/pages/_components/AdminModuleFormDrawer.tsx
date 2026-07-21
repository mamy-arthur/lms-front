'use client';

import { memo, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ModuleForm } from './module-form';
import { genIdentifier } from './module-form-utils';
import { useModuleFormDrawer } from './use-module-form-drawer';
import { useCreateModule } from '../../hooks/useCreateModule';
import { useUpdateModule } from '../../hooks/useUpdateModule';
import { useModule } from '../../hooks/useModule';
import { moduleSchema, MODULE_FORM_DEFAULTS } from '../../validation';
import type { Module, ModulePayload } from '../../types';
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

  // Fetch full details when editing to ensure course_ids are populated
  // (the list endpoint may omit them for performance).
  // Keyed by idnumber per cache convention.
  const { data: detailedModule } = useModule(
    isEdit ? module?.idnumber : undefined,
    isEdit ? module?.id : undefined,
  );

  const defaultValues = useMemo(() => {
    if (module) {
      return {
        shortname: module.shortname,
        idnumber: module.idnumber,
        // Prefer detail data (full description + courseIds); fall back to list data
        description: detailedModule?.description ?? module.description,
        category: module.category,
        courseIds: detailedModule?.courseIds ?? module.courseIds,
      };
    }
    if (duplicateFrom) {
      return {
        shortname: duplicateFrom.shortname,
        idnumber: duplicateFrom.idnumber,
        description: duplicateFrom.description,
        category: duplicateFrom.category,
        courseIds: duplicateFrom.courseIds,
      };
    }
    return MODULE_FORM_DEFAULTS;
  }, [module, duplicateFrom, detailedModule]);

  const formModule = isDuplicate ? undefined : module;

  const formState = useModuleFormDrawer({
    open,
    onClose,
    onSuccess,
    module: formModule,
    createMutation,
    updateMutation,
    schema: moduleSchema,
    defaultValues,
    createDefaults: MODULE_FORM_DEFAULTS,
    buildCreatePayload: (values): ModulePayload => ({
      shortname: values.shortname,
      idnumber: values.idnumber,
      description: values.description ?? '',
      course_ids: values.courseIds,
      // category is intentionally omitted — backend does not implement it yet
    }),
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        shortname: values.shortname,
        idnumber: values.idnumber,
        description: values.description ?? '',
        course_ids: values.courseIds,
      } as ModulePayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  const title = isEdit
    ? 'Modifier le module'
    : isDuplicate
      ? 'Dupliquer le module'
      : 'Ajouter un module';

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 overflow-hidden !w-[40vw] !max-w-[40vw]"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Renseignez les informations pour le module.</SheetDescription>
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
          shortname={formState.shortname}
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
