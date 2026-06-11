import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { getCategoryPath, useCoursesStore } from "../../lib/course-store";
import { Category } from "../../types";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  identifier: z.string().min(1, "Identifiant requis"),
  parentId: z.string().nullable(),
  visible: z.boolean(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  category?: Category | null;
  defaultParentId?: string | null;
  onDone?: () => void;
};

export function CategoryForm({ category, defaultParentId = null, onDone }: Props) {
  const { categories, upsertCategory } = useCoursesStore();

  const defaults = useMemo<FormValues>(
    () => ({
      name: category?.name ?? "",
      identifier: category?.identifier ?? "",
      parentId: category?.parentId ?? defaultParentId ?? null,
      visible: category?.visible ?? true,
      description: category?.description ?? "",
    }),
    [category, defaultParentId],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const visible = form.watch("visible");
  const parentId = form.watch("parentId");

  // Prevent selecting itself or descendants as parent (simple: exclude self)
  const eligibleParents = categories.filter((c) => c.id !== category?.id);

  const onSubmit = (values: FormValues) => {
    upsertCategory({ ...values, id: category?.id });
    toast.success(category ? "Catégorie mise à jour" : "Catégorie créée");
    form.reset({
      name: "",
      identifier: "",
      parentId: defaultParentId ?? null,
      visible: true,
      description: "",
    });
    onDone?.();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Catégorie supérieure</Label>
          <Select
            value={parentId ?? "none"}
            onValueChange={(v) => form.setValue("parentId", v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune (racine)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune (racine)</SelectItem>
              {eligibleParents.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {getCategoryPath(categories, c.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-name">Nom de la catégorie</Label>
          <Input id="cat-name" placeholder="Frontend" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-id">Identifiant</Label>
          <Input id="cat-id" placeholder="DEV-FE" {...form.register("identifier")} />
          {form.formState.errors.identifier && (
            <p className="text-xs text-destructive">
              {form.formState.errors.identifier.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="cat-visible">Visible</Label>
            <p className="text-xs text-muted-foreground">
              {visible ? "Visible publiquement" : "Masquée"}
            </p>
          </div>
          <Switch
            id="cat-visible"
            checked={visible}
            onCheckedChange={(v) => form.setValue("visible", v)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea id="cat-desc" rows={3} {...form.register("description")} />
      </div>

      <div className="flex justify-end gap-2">
        {category && (
          <Button type="button" variant="ghost" onClick={() => onDone?.()}>
            Annuler
          </Button>
        )}
        <Button type="submit">{category ? "Sauvegarder" : "Créer la catégorie"}</Button>
      </div>
    </form>
  );
}
