'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContentTypes } from '../hooks/useContentTypesQuery';
import type { ContentType } from '../types';
import { ContentTypeTable } from './_components/content-type-table';
import { ContentTypeForm } from './_components/content-type-form';

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentTypesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | undefined>(
    undefined,
  );

  const { data, isLoading } = useContentTypes();
  const contentTypes = data?.data ?? [];

  // Module types already taken — exclude the currently-edited entry so its own type
  // doesn't appear as "Déjà utilisé" while editing.
  const usedModuleTypes = contentTypes
    .filter((ct) => ct.id !== selectedContentType?.id)
    .map((ct) => ct.module_type);

  const handleCreate = () => {
    setSelectedContentType(undefined);
    setFormOpen(true);
  };

  const handleEdit = (ct: ContentType) => {
    setSelectedContentType(ct);
    setFormOpen(true);
  };

  const handleView = (ct: ContentType) => {
    setSelectedContentType(ct);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setSelectedContentType(undefined);
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Type de contenu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Définissez les schémas de champs pour chaque module de cours.
          </p>
        </div>
        <Button onClick={handleCreate} className='bg-(--color-primary) hover:bg-(--color-primary)/80'>
          <Plus className="size-4" />
          Nouveau type de contenu
        </Button>
      </header>

      {/* Table */}
      <ContentTypeTable
        contentTypes={contentTypes}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
      />

      {/* Create / Edit sheet */}
      <ContentTypeForm
        open={formOpen}
        onOpenChange={handleFormClose}
        contentType={selectedContentType}
        usedModuleTypes={usedModuleTypes}
      />
    </div>
  );
}
