import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { MainBlock, Field } from './SharedBlocks';
import { FormActions } from './PageForm';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';

const schema = z.object({
  title: z.string().min(1, 'Le nom est obligatoire'),
  url: z.string().url('URL invalide'),
  description: z.string().optional(),
});
export type UrlFormValues = z.infer<typeof schema>;

export function UrlForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: UrlFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState, setValue, watch } = useForm<UrlFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', url: '', description: '' },
  });

  const description = watch('description');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <MainBlock>
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input {...register('title')} />
          {formState.errors.title && (
            <p className="text-xs text-destructive">{formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>URL</Label>
          <Input type="url" placeholder="https://..." {...register('url')} />
          {formState.errors.url && (
            <p className="text-xs text-destructive">{formState.errors.url.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <RichTextEditor
            value={description ?? ''}
            onChange={(md) =>
              setValue('description', md, {
                shouldDirty: true,
              })
            }
            placeholder="Décrivez le fichier…"
          />
        </div>
      </MainBlock>
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}
