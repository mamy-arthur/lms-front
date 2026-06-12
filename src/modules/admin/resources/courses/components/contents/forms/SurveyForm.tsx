import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainBlock, Field } from "./SharedBlocks";
import { FormActions } from "./PageForm";

const schema = z.object({
  title: z.string().min(1, "Le nom est obligatoire"),
  surveyType: z.string().min(1, "Type requis"),
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
  const { register, handleSubmit, formState, control } = useForm<SurveyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", surveyType: "attls", description: "" },
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
        <Field label="Type de sondage" required>
          <Controller
            control={control}
            name="surveyType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attls">ATTLS</SelectItem>
                  <SelectItem value="colles">COLLES</SelectItem>
                  <SelectItem value="critical-incidents">Incidents critiques</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Description">
          <Textarea {...register("description")} rows={3} />
        </Field>
      </MainBlock>
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}