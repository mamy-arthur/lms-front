import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainBlock, Field } from './SharedBlocks';
import { FormActions } from './PageForm';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';

const schema = z.object({
  title: z.string().min(1, 'Le nom est obligatoire'),
  surveyType: z.string().min(1, 'Type requis'),
  description: z.string().optional(),
});
export type SurveyFormValues = z.infer<typeof schema>;

export function SurveyForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: SurveyFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState, control, setValue, watch } = useForm<SurveyFormValues>(
    {
      resolver: zodResolver(schema),
      defaultValues: { title: '', surveyType: 'attls', description: '' },
    },
  );

  const description = watch('description');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <MainBlock>
        <div className="space-y-2">
          <Label>Nom</Label>
          <Input {...register('title')} placeholder="Ex : Module SCORM - Sécurité incendie" />
          {formState.errors.title && (
            <p className="text-xs text-destructive">{formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2 w-full">
          <Label>Type de sondage</Label>
          <Controller
            control={control}
            name="surveyType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="attls">ATTLS</SelectItem>
                  <SelectItem value="colles">COLLES</SelectItem>
                  <SelectItem value="critical-incidents">Incidents critiques</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
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
