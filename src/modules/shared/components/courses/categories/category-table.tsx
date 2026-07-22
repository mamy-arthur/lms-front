import { memo, useCallback, useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, FolderTree, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { buildCategoryTree, useCoursesStore } from '../lib/course-store';
import type { Category } from '../types/index';
import { toast } from 'sonner';
import { CategoryFormDialog } from './category-form-dialog';

type CategoryRow = Category & { depth: number };

function CategoryTableBase() {
  const { categories, deleteCategory } = useCoursesStore();
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    category: Category | null;
    defaultParentId: string | null;
  }>({ open: false, category: null, defaultParentId: null });
  // const [search, setSearch] = useState('');

  const rows: CategoryRow[] = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const flat = tree.map(({ category, depth }) => ({
      ...category,
      depth,
    }));
    return flat;
    // if (!search.trim()) return flat;
    // const lower = search.toLowerCase();
    // return flat.filter((r) => r.name.toLowerCase().includes(lower));
  }, [categories]);

  const parentName = useCallback(
    (id: string | null) => (id ? (categories.find((c) => c.id === id)?.name ?? null) : null),
    [categories],
  );

  const CategoryCard = useCallback(
    function CategoryCard({ item }: { item: CategoryRow }) {
      const parent = parentName(item.parentId);
      return (
        <div className="group relative flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50">
            <div className="flex flex-col min-w-0 gap-2">
              <span className="truncate font-medium text-xs">{item.name}</span>
              {parent && (
                <span className="text-xs text-muted-foreground">
                  Sous-catégorie de <span className="font-medium">{parent}</span>
                </span>
              )}

              {item.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground transition-opacity"
                    aria-label={`Actions pour ${item.name}`}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-fit">
                  <DropdownMenuItem
                    onClick={() => setDialog({ open: true, category: item, defaultParentId: null })}
                  >
                    <Pencil className="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setDialog({ open: true, category: null, defaultParentId: item.id })
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Ajouter une sous-catégorie
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmDelete(item)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      );
    },
    [parentName, setDialog, setConfirmDelete],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div> */}
        <div>
          <span className="text-xs text-muted-foreground">
            {rows.length} catégorie{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant={'outline'}
          onClick={() => setDialog({ open: true, category: null, defaultParentId: null })}
        >
          <Plus className="size-3" />
          Ajouter
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <FolderTree className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Aucune catégorie</p>
            <p className="text-xs text-muted-foreground">Créez-en une via le bouton ci-dessus.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <CategoryCard key={row.id} item={row} />
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les sous-catégories et les cours liés à « {confirmDelete?.name} » seront détachés
              (placés à la racine / sans catégorie).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete) {
                  try {
                    await deleteCategory(confirmDelete.id);
                    toast.success('Catégorie supprimée');
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error &&
                      (err as { json?: { message?: string } }).json?.message;
                    toast.error(
                      msg === 'course.category_has_courses'
                        ? 'Des cours sont encore liés à cette catégorie'
                        : 'Erreur lors de la suppression',
                    );
                  }
                }
                setConfirmDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryFormDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}
        category={dialog.category}
        defaultParentId={dialog.defaultParentId}
      />
    </div>
  );
}

export const CategoryTable = memo(CategoryTableBase);
