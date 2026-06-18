import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MainBlock } from "./SharedBlocks";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";

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
    const { register, handleSubmit, formState, watch, setValue } = form;
    const description = watch("description");
    const content = watch("content");

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
                    <Label>Contenu</Label>
                    <RichTextEditor
                        value={content ?? ""}
                        onChange={(md) =>
                            setValue("content", md, {
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
            <Button
                type="submit"
                disabled={submitting}
                className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            >
                Enregistrer
            </Button>
        </div>
    );
}
