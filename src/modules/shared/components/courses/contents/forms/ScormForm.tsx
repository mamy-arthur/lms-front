import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MainBlock, Field } from "./SharedBlocks";
import { FormActions } from "./PageForm";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/modules/shared/components/tiptap/RichTextEditor";
import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { FileArchive, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/modules/shared/components/input-upload/FileUploadField";

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
    onSubmit: (v: ScormFormValues, file: File | null) => void;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState, control, setValue, watch } =
        useForm<ScormFormValues>({
            resolver: zodResolver(schema),
            defaultValues: {
                title: "",
                description: "",
                packageType: "depot",
                updateFrequency: "never",
            },
        });
    const [packageFileObject, setPackageFileObject] = useState<File | null>(
        null,
    );
    const description = watch("description");
    const packageFile = watch("packageFile");

    const submitWithFile = (values: ScormFormValues) => {
        onSubmit(values, packageFileObject);
    };

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
            </MainBlock>
            <MainBlock title="Paquetage">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Controller
                        control={control}
                        name="packageType"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    <SelectItem value="depot">
                                        Paquetage déposé
                                    </SelectItem>
                                    <SelectItem value="externe">
                                        Manifeste SCORM externe
                                    </SelectItem>
                                    <SelectItem value="download">
                                        Paquetage télechargé
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <FileUploadField
                    label="Fichier du package"
                    fileName={packageFile}
                    onFileSelect={(file) => {
                        setValue("packageFile", file.name);
                        setPackageFileObject(file);
                    }}
                    onRemove={() => {
                        setValue("packageFile", "");
                        setPackageFileObject(null);
                    }}
                />
                <div className="space-y-2">
                    <Label>Fréquence de mise à jour</Label>
                    <Controller
                        control={control}
                        name="updateFrequency"
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    <SelectItem value="never">
                                        Jamais
                                    </SelectItem>
                                    <SelectItem value="daily">
                                        Chaque jour
                                    </SelectItem>
                                    <SelectItem value="each-use">
                                        À chaque utilisation
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
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
