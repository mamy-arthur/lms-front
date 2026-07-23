'use client';

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateLearningPathCategory } from '../../hooks/useCreateLearningPathCategory';
import { useUpdateLearningPathCategory } from '../../hooks/useUpdateLearningPathCategory';
import { useDeleteLearningPathCategory } from '../../hooks/useDeleteLearningPathCategory';
import type { LearningPathCategory } from '../../types';

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Modifiez les informations de la catégorie.' : 'Créez une nouvelle catégorie de parcours.'}
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nom *</Label>
            <Input
              id="cat-name"
              {...register('name')}
              placeholder="Ex: Management"
              className="h-8 text-sm"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              {...register('description')}
              placeholder="Description optionnelle..."
              className="resize-none text-sm"
              rows={2}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="category-form" size="sm" disabled={isPending}>
            {isEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

type Props = {
  categories: LearningPathCategory[];
  isLoading: boolean;
};

export function LearningPathCategoriesSection({ categories, isLoading }: Props) {
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Catégories</h2>
          <p className="text-xs text-muted-foreground">Organisez vos parcours par catégorie.</p>
        </div>
        <Button size="sm" variant="outline" onClick={openNew} className="h-7 gap-1 text-xs">
          <Plus className="size-3" />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : categories.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune catégorie créée.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    aria-label={`Actions pour ${cat.name}`}
                  >
                    <MoreHorizontal className="size-3.5" />
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
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
    </section>
  );
}
