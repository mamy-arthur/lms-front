'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MailTemplateSearch,
  MailTemplatePreviewDialog,
} from '@modules/shared/components/mail-templates';
import { useAllTenantsQuery } from '@/modules/shared/hooks/useAllTenantsQuery';
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { useMailTemplatesQuery } from '../hooks/useMailTemplatesQuery';
import { useDeleteMailTemplate } from '../hooks/useDeleteMailTemplate';
import type { MailTemplate } from '../types';
import { AdminMailTemplateFormDrawer } from './_components/admin-mail-template-form-drawer';
import { AdminMailTemplatesFilter } from './_components/admin-mail-templates-filter';
import { AdminMailTemplatesTable } from './_components/admin-mail-templates-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';

export function MailTemplatesList() {
  const ctrl = useModuleListController<MailTemplate>({
    includeTenantFilter: true,
    defaultPageSize: 25,
  });

  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];

  const { data, isLoading } = useMailTemplatesQuery(ctrl.params);
  const { mutate: deleteTemplate } = useDeleteMailTemplate();
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplate | null>(null);
  const [deletingItem, setDeletingItem] = useState<MailTemplate | null>(null);

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) {
      map[String(t.id)] = t.name;
    }
    return map;
  }, [tenants]);

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
            tenantFilter={ctrl.draftTenant}
            onStatusFilterChange={(value) => ctrl.setDraftCategory([value])}
            onTenantFilterChange={ctrl.setDraftTenant}
            onSearch={ctrl.handleSearch}
            tenants={tenants}
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

      <AdminMailTemplatesTable
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
        onDelete={(tpl) => setDeletingItem(tpl)}
        onPreview={setPreviewTemplate}
        tenantNames={tenantNames}
      />

      <AdminMailTemplateFormDrawer
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

      <ConfirmDialog
        open={deletingItem !== null}
        title="Supprimer le template"
        description={
          deletingItem
            ? `Êtes-vous sûr de vouloir supprimer «${deletingItem.name}» ? Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteTemplate(deletingItem.id);
        }}
      />
    </div>
  );
}
