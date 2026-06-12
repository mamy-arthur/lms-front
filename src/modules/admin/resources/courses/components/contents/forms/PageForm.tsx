import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  MainBlock,
  SecondaryAccordions,
  AppearanceStandard,
  Field,
} from "./SharedBlocks";

const schema = z.object({
  title: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  content: z.string().optional(),
});
export type PageFormValues = z.infer<typeof schema>;

export function PageForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: PageFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<PageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", content: "" },
  });
  const { register, handleSubmit, formState } = form;

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
        <Field label="Contenu">
          <Textarea {...register("content")} rows={8} />
        </Field>
      </MainBlock>
      <SecondaryAccordions appearance={<AppearanceStandard />} />
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}

export function FormActions({
  onCancel,
  submitting,
}: {
  onCancel: () => void;
  submitting?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
      <Button type="submit" disabled={submitting}>
        Enregistrer
      </Button>
    </div>
  );
}