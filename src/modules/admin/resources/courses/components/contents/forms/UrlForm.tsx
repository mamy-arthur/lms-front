import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MainBlock, Field } from "./SharedBlocks";
import { FormActions } from "./PageForm";

const schema = z.object({
  title: z.string().min(1, "Le nom est obligatoire"),
  url: z.string().url("URL invalide"),
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
  const { register, handleSubmit, formState } = useForm<UrlFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", url: "", description: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <MainBlock>
        <Field label="Nom" required>
          <Input {...register("title")} />
          {formState.errors.title && (
            <p className="text-xs text-destructive">{formState.errors.title.message}</p>
          )}
        </Field>
        <Field label="URL" required>
          <Input type="url" placeholder="https://..." {...register("url")} />
          {formState.errors.url && (
            <p className="text-xs text-destructive">{formState.errors.url.message}</p>
          )}
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} rows={3} />
        </Field>
      </MainBlock>
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}