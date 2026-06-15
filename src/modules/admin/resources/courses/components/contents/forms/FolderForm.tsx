import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MainBlock,
  SecondaryAccordions,
  AppearanceStandard,
  Field,
} from "./SharedBlocks";
import { FormActions } from "./PageForm";

const schema = z.object({
  title: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  fileCount: z.number().optional(),
});
export type FolderFormValues = z.infer<typeof schema>;

export function FolderForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: FolderFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState, setValue, watch } = useForm<FolderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", fileCount: 0 },
  });
  const count = watch("fileCount");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <MainBlock>
        <Field label="Nom" required>
          <Input {...register("title")} />
          {formState.errors.title && (
            <p className="text-xs text-destructive">{formState.errors.title.message}</p>
          )}
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} rows={2} />
        </Field>
        <Field label="Fichiers" hint={count ? `${count} fichier(s) sélectionné(s)` : undefined}>
          <Input
            type="file"
            multiple
            onChange={(e) => setValue("fileCount", e.target.files?.length ?? 0)}
          />
        </Field>
      </MainBlock>
      <SecondaryAccordions appearance={<AppearanceStandard />} />
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}