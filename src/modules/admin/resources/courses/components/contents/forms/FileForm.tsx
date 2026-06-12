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
import { AdvancedSettingsDialog } from "../AdvancedSettingsDialog";
import { Label } from "@/components/ui/label";

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
    const { register, handleSubmit, formState, setValue, watch } =
        useForm<FileFormValues>({
            resolver: zodResolver(schema),
            defaultValues: { title: "", description: "", fileName: "" },
        });
    const fileName = watch("fileName");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <MainBlock>
                <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input {...register("title")} />
                    {formState.errors.title && (
                        <p className="text-xs text-destructive">
                            {formState.errors.title.message}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea {...register("description")} rows={2} />
                </div>
                <div className="space-y-2">
                    <Label>Fichier</Label>
                    <Input
                        type="file"
                        onChange={(e) =>
                            setValue(
                                "fileName",
                                e.target.files?.[0]?.name ?? "",
                            )
                        }
                    />
                    <span>
                        {fileName ? `Sélectionné : ${fileName}` : undefined}
                    </span>
                </div>
            </MainBlock>
            <div className="flex items-center justify-between">
                <AdvancedSettingsDialog>
                    <SecondaryAccordions appearance={<AppearanceStandard />} />
                </AdvancedSettingsDialog>
                <FormActions
                    onCancel={onCancel}
                    submitting={formState.isSubmitting}
                />
            </div>
        </form>
    );
}
