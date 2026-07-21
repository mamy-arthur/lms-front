'use client';

import { Loader2, MoreVertical, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateLearningPathCategory } from '../../hooks/useCreateLearningPathCategory';
import { useDeleteLearningPathCategory } from '../../hooks/useDeleteLearningPathCategory';
import { useUpdateLearningPathCategory } from '../../hooks/useUpdateLearningPathCategory';
import type { LearningPathCategory } from '../../types';
import { Separator } from '@/components/ui/separator';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Category Form Dialog ─────────────────────────────────────────────────────

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: LearningPathCategory;
};

function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEdit = !!category;
  const createMutation = useCreateLearningPathCategory();
  const updateMutation = useUpdateLearningPathCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? '',
      description: category?.description ?? null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          name: values.name,
          description: values.description ?? null,
        });
        toast.success('Catégorie mise à jour');
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description ?? null,
        });
        toast.success('Catégorie créée');
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Une erreur est survenue');
    }
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez le nom ou la description de cette catégorie.'
              : 'Créez une nouvelle catégorie pour organiser vos parcours.'}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <form id="category-form-drawer" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name-drawer">Nom *</Label>
            <Input
              id="cat-name-drawer"
              {...register('name')}
              placeholder="Ex: Management"
              className="h-8 text-sm"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-description-drawer">Description</Label>
            <Textarea
              id="cat-description-drawer"
              {...register('description')}
              placeholder="Description optionnelle..."
              className="resize-none text-sm"
              rows={2}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="category-form-drawer"
            disabled={isPending}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: LearningPathCategory[];
  isLoading: boolean;
};

export function LearningPathCategoriesDrawer({ open, onOpenChange, categories, isLoading }: Props) {
  const deleteMutation = useDeleteLearningPathCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LearningPathCategory | undefined>();

  const openNew = () => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  };

  const openEdit = (cat: LearningPathCategory) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Catégorie supprimée');
    } catch {
      toast.error('Impossible de supprimer cette catégorie (des parcours y sont rattachés)');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col gap-0 p-0 max-w-187.5!">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Gérer les catégories</SheetTitle>
            <SheetDescription>
              Ajoutez, modifiez ou supprimez les catégories de parcours.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden px-6 pb-6 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={openNew} className="gap-1 text-xs">
                <Plus className="size-3" />
                Ajouter
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Chargement...</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune catégorie créée.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-xs font-medium">{cat.name}</p>
                        {cat.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0 text-muted-foreground"
                            aria-label={`Actions pour ${cat.name}`}
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEdit(cat)}>
                            <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(cat.id)}
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
          </div>
        </SheetContent>
      </Sheet>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
    </>
  );
}
