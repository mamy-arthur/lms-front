'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MailTemplateSearch } from '@modules/shared/components/mail-templates';
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { usePortalMailTemplatesQuery } from '../hooks/usePortalMailTemplatesQuery';
import type { MailTemplate } from '../types';
import { PortalMailTemplateFormDrawer } from './_components/portal-mail-template-form-drawer';
import { PortalMailTemplatesTable } from './_components/portal-mail-templates-table';

export function PortalMailTemplatesList() {
  const ctrl = useModuleListController<MailTemplate>({
    defaultPageSize: 25,
  });

  const { data, isLoading } = usePortalMailTemplatesQuery(ctrl.params);

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
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-primary/80 text-primary-foreground shrink-0"
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
        onDelete={() => {}}
      />

      <PortalMailTemplateFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        template={ctrl.editingModule as MailTemplate | undefined}
      />
    </div>
  );
}
