"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { MainBlock } from "./SharedBlocks";
import { FormActions } from "./PageForm";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";
import { useState } from "react";
import { FileUploadField } from "@/modules/shared/components/input-upload/FileUploadField";

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
    onSubmit: (v: FileFormValues, file: File | null) => void;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState, setValue, watch } =
        useForm<FileFormValues>({
            resolver: zodResolver(schema),
            defaultValues: { title: "", description: "", fileName: "" },
        });
    const [fileObject, setFileObject] = useState<File | null>(null);
    const fileName = watch("fileName");
    const description = watch("description");
    const submitWithFile = (values: FileFormValues) => {
        onSubmit(values, fileObject);
    };

    console.log('description : ' ,  description)

    return (
        <form onSubmit={handleSubmit(submitWithFile)} className="space-y-4">
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
                <FileUploadField
                    label="Fichier"
                    fileName={fileName}
                    onFileSelect={(file) => {
                        setValue("fileName", file.name);
                        setFileObject(file);
                    }}
                    onRemove={() => {
                        setValue("fileName", "");
                        setFileObject(null);
                    }}
                    hint="PDF ou WORD"
                />
            </MainBlock>
            <FormActions
                onCancel={onCancel}
                submitting={formState.isSubmitting}
            />
        </form>
    );
}
