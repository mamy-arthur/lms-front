import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MainBlock,
  SecondaryAccordions,
  Field,
  CheckboxRow,
} from "./SharedBlocks";
import { FormActions } from "./PageForm";

const schema = z.object({
  title: z.string().min(1, "Le nom est obligatoire"),
  text: z.string().optional(),
});
export type TextMediaFormValues = z.infer<typeof schema>;

export function TextMediaForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: TextMediaFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState } = useForm<TextMediaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", text: "" },
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
        <Field label="Texte">
          <Textarea {...register("text")} rows={8} />
        </Field>
      </MainBlock>
      <SecondaryAccordions
        appearance={
          <div className="space-y-3">
            <CheckboxRow id="tm-show-desc" label="Afficher la description" />
            <CheckboxRow
              id="tm-show-modified"
              label="Afficher la date de dernière modification"
            />
          </div>
        }
      />
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}