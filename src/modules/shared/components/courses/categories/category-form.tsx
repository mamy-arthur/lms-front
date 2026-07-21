import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import { getCategoryPath, useCoursesStore } from '../lib/course-store';
import { Category } from '../types';
import { Loader2, Save } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  parentId: z.string().nullable(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  category?: Category | null;
  defaultParentId?: string | null;
  onDone?: () => void;
};

export function CategoryForm({ category, defaultParentId = null, onDone }: Props) {
  const { categories, upsertCategory } = useCoursesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaults = useMemo<FormValues>(
    () => ({
      name: category?.name ?? '',
      parentId: category?.parentId ?? defaultParentId ?? null,
      description: category?.description ?? '',
    }),
    [category, defaultParentId],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const parentId = form.watch('parentId');

  const eligibleParents = categories.filter((c) => c.id !== category?.id);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await upsertCategory({ ...values, id: category?.id });
      toast.success(category ? 'Catégorie mise à jour' : 'Catégorie créée');
      form.reset({ name: '', parentId: defaultParentId ?? null, description: '' });
      onDone?.();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Catégorie supérieure</Label>
            <Select
              value={parentId ?? 'none'}
              onValueChange={(v) => form.setValue('parentId', v === 'none' ? null : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucune (racine)" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="none">Aucune (racine)</SelectItem>
                {eligibleParents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getCategoryPath(categories, c.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-name">Nom de la catégorie</Label>
            <Input id="cat-name" placeholder="Frontend" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-desc">Description</Label>
          <Textarea id="cat-desc" rows={3} {...form.register('description')} />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
