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
}

function AdminModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module,
}: AdminModuleFormDrawerProps) {
  const isEdit = !!module;

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();

  // Fetch full details when editing to ensure course_ids are populated
  // (the list endpoint may omit them for performance).
  // Keyed by idnumber per cache convention.
  const { data: detailedModule, isLoading: isDetailedModuleLoading } = useModule(
    isEdit ? module?.idnumber : undefined,
    isEdit ? module?.id : undefined,
  );

  // The list payload never carries course names, so until the detail request
  // resolves the selection would otherwise render raw course ids.
  const isCoursesLoading = isEdit && isDetailedModuleLoading && !detailedModule;

  const defaultValues = useMemo(() => {
    if (module) {
      return {
        shortname: module.shortname,
        // Prefer detail data (full description + courseIds); fall back to list data
        description: detailedModule?.description ?? module.description,
        category_id: detailedModule?.category_id ?? module.category_id ?? '',
        courseIds: detailedModule?.courseIds ?? module.courseIds,
      };
    }
    return MODULE_FORM_DEFAULTS;
  }, [module, detailedModule]);

  // The detail endpoint embeds each linked course with its name and category,
  // so the form can label the selection without resolving ids one by one.
  const formModule = useMemo(
    () => (module ? { ...module, courses: detailedModule?.courses ?? module.courses } : undefined),
    [module, detailedModule],
  );

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
      description: values.description ?? '',
      category_id: values.category_id,
      course_ids: values.courseIds,
    }),
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        shortname: values.shortname,
        description: values.description ?? '',
        category_id: values.category_id,
        course_ids: values.courseIds,
      } as ModulePayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  const title = isEdit ? 'Modifier le module' : 'Ajouter un module';

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 overflow-hidden p-0  max-w-187.5!"
        showCloseButton={true}
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
          addCourses={formState.addCourses}
          selectedCourses={formState.selectedCourses}
          isCoursesLoading={isCoursesLoading}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminModuleFormDrawer = memo(AdminModuleFormDrawerBase);
