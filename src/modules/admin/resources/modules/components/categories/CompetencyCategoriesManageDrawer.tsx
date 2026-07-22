'use client';

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { extractApiError } from '@/shared/utils/api-error';
import type { CompetencyCategory } from '../../types';
import { useCompetencyCategoriesQuery } from '../../hooks/useCompetencyCategoriesQuery';
import { useDeleteCompetencyCategory } from '../../hooks/useDeleteCompetencyCategory';
import { CompetencyCategoryModal } from './CompetencyCategoryModal';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompetencyCategoriesManageDrawer({ open, onOpenChange }: Props) {
  const { data: categories = [], isLoading } = useCompetencyCategoriesQuery(open);
  const deleteMutation = useDeleteCompetencyCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompetencyCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompetencyCategory | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (category: CompetencyCategory) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 max-w-187.5!">
          <SheetHeader className="border-b px-4 py-4">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="space-y-1">
                <SheetTitle>Gérer les catégories</SheetTitle>
                <SheetDescription>
                  Consultez, modifiez ou supprimez les catégories de modules.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={openCreate}
                className="shrink-0"
                variant="outline"
              >
                <Plus className="size-3.5" />
                Ajouter
              </Button>
            </div>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Chargement…</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune catégorie pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start justify-between gap-2 rounded-lg border bg-card p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      {category.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{category.idnumber}</p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground"
                          aria-label={`Actions pour ${category.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(category)}>
                          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(category)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CompetencyCategoryModal
        open={formOpen}
        category={editing}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) {
            setDeleteTarget(null);
            deleteMutation.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie « {deleteTarget?.name} » ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.isError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {extractApiError(deleteMutation.error, true)}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
