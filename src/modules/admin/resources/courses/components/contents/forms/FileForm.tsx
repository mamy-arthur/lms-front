"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { MainBlock } from "./SharedBlocks";
import { FormActions } from "./PageForm";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";

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
    const description = watch("description");
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
                    <span className="text-xs text-gray-600">
                        {fileName ? `Sélectionné : ${fileName}` : undefined}
                    </span>
                </div>
            </MainBlock>
            <FormActions
                onCancel={onCancel}
                submitting={formState.isSubmitting}
            />
        </form>
    );
}
