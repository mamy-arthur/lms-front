import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { MainBlock } from "./SharedBlocks";
import { FormActions } from "./PageForm";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MultiFileUploadField } from "@/modules/shared/components/input-upload/MultiFileUploadField";

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
    onSubmit: (v: FolderFormValues, files: File[]) => void;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState, setValue, watch } =
        useForm<FolderFormValues>({
            resolver: zodResolver(schema),
            defaultValues: { title: "", description: "", fileCount: 0 },
        });
    const [packageFiles, setPackageFiles] = useState<File[]>([]);
    const description = watch("description");

    const handleFilesChange = (files: File[]) => {
        setPackageFiles(files);
        setValue("fileCount", files.length, { shouldDirty: true });
    };

    const submitWithFiles = (values: FolderFormValues) => {
        onSubmit(values, packageFiles);
    };

    return (
        <form onSubmit={handleSubmit(submitWithFiles)} className="space-y-4">
            <MainBlock>
                <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                        {...register("title")}
                        placeholder="Ex : Module SCORM - Sécurité incendie"
                    />
                    {formState.errors.title && (
                        <p className="text-xs text-destructive">
                            {formState.errors.title.message}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <RichTextEditor
                        value={description ?? ""}
                        onChange={(md) =>
                            setValue("description", md, {
                                shouldDirty: true,
                            })
                        }
                        placeholder="Décrivez le fichier…"
                    />
                </div>
                <MultiFileUploadField
                    label="Fichiers"
                    files={packageFiles}
                    onFilesChange={handleFilesChange}
                />
            </MainBlock>
            <FormActions
                onCancel={onCancel}
                submitting={formState.isSubmitting}
            />
        </form>
    );
}
