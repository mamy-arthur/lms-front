import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { MainBlock, Field } from "./SharedBlocks";
import { FormActions } from "./PageForm";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";
import { Label } from "@/components/ui/label";

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
    const { register, handleSubmit, formState, setValue, watch } =
        useForm<TextMediaFormValues>({
            resolver: zodResolver(schema),
            defaultValues: { title: "", text: "" },
        });
    const text = watch("text");
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <Label>Texte</Label>
                    <RichTextEditor
                        value={text ?? ""}
                        onChange={(md) =>
                            setValue("text", md, {
                                shouldDirty: true,
                            })
                        }
                        placeholder="Décrivez le fichier…"
                    />
                </div>
            </MainBlock>
            <FormActions
                onCancel={onCancel}
                submitting={formState.isSubmitting}
            />
        </form>
    );
}
