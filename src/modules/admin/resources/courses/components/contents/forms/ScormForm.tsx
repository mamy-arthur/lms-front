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
  description: z.string().optional(),
  packageType: z.string().optional(),
  packageFile: z.string().optional(),
  updateFrequency: z.enum(["never", "daily", "each-use"]),
});
export type ScormFormValues = z.infer<typeof schema>;

export function ScormForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: ScormFormValues) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState, control, setValue, watch } =
    useForm<ScormFormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        title: "",
        description: "",
        packageType: "zip",
        updateFrequency: "never",
      },
    });
  const fileName = watch("packageFile");

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
      </MainBlock>
      <MainBlock title="Paquetage">
        <Field label="Type">
          <Controller
            control={control}
            name="packageType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP (.zip)</SelectItem>
                  <SelectItem value="xml">XML (.xml)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Fichier paquetage" hint={fileName ? `Sélectionné : ${fileName}` : undefined}>
          <Input
            type="file"
            accept="application/xml,application/zip,.xml,.zip"
            onChange={(e) => setValue("packageFile", e.target.files?.[0]?.name ?? "")}
          />
        </Field>
        <Field label="Fréquence de mise à jour">
          <Controller
            control={control}
            name="updateFrequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Jamais</SelectItem>
                  <SelectItem value="daily">Chaque jour</SelectItem>
                  <SelectItem value="each-use">À chaque utilisation</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </MainBlock>
      <FormActions onCancel={onCancel} submitting={formState.isSubmitting} />
    </form>
  );
}