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
  fileName: z.string().optional(),
});
export type FileFormValues = z.infer<typeof schema>;

export function FileForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: FileFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState, setValue, watch } = useForm<FileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", fileName: "" },
  });
  const fileName = watch("fileName");

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
        <Field label="Fichier" hint={fileName ? `Sélectionné : ${fileName}` : undefined}>
          <Input
            type="file"
            onChange={(e) => setValue("fileName", e.target.files?.[0]?.name ?? "")}
          />
        </Field>
      </MainBlock>
      <SecondaryAccordions appearance={<AppearanceStandard />} />
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}