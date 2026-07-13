'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MailTemplateSearch,
  MailTemplatePreviewDialog,
} from '@modules/shared/components/mail-templates';
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { usePortalMailTemplatesQuery } from '../hooks/usePortalMailTemplatesQuery';
import { useDeletePortalMailTemplate } from '../hooks/useDeletePortalMailTemplate';
import type { MailTemplate } from '../types';
import { AdminMailTemplatesFilter } from '@/modules/admin/resources/mail-templates/pages/_components/admin-mail-templates-filter';
import { PortalMailTemplateFormDrawer } from './_components/portal-mail-template-form-drawer';
import { PortalMailTemplatesTable } from './_components/portal-mail-templates-table';

export function PortalMailTemplatesList() {
  const ctrl = useModuleListController<MailTemplate>({
    defaultPageSize: 25,
  });

  const { data, isLoading } = usePortalMailTemplatesQuery(ctrl.params);
  const { mutate: deleteTemplate } = useDeletePortalMailTemplate();
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplate | null>(null);

  return (
    <div className="bg-background">
      <header className="mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates mail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez les templates d'email.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <MailTemplateSearch
          value={ctrl.draftSearch}
          onChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <AdminMailTemplatesFilter
            statusFilter={ctrl.draftCategory[0] ?? 'all'}
            tenantFilter="all"
            onStatusFilterChange={(value) => ctrl.setDraftCategory([value])}
            onTenantFilterChange={() => {}}
            onSearch={ctrl.handleSearch}
            tenants={[]}
            showTenantFilter={false}
          />
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouveau template
          </Button>
        </div>
      </div>

      <PortalMailTemplatesTable
        templates={data?.data ?? []}
        isLoading={isLoading}
        hasQuery={ctrl.hasQuery}
        page={ctrl.page}
        pageSize={ctrl.pageSize}
        total={data?.total ?? 0}
        sort={ctrl.sort}
        onSort={ctrl.handleSort}
        onPageChange={ctrl.handlePageChange}
        onPageSizeChange={ctrl.handlePageSizeChange}
        onEdit={ctrl.handleEdit}
        onDelete={(tpl) => deleteTemplate(tpl.id)}
        onPreview={setPreviewTemplate}
      />

      <PortalMailTemplateFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        template={ctrl.editingModule as MailTemplate | undefined}
      />

      {previewTemplate && (
        <MailTemplatePreviewDialog
          open={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          name={previewTemplate.name}
          reference={previewTemplate.reference}
          body={previewTemplate.body}
        />
      )}
    </div>
  );
}
