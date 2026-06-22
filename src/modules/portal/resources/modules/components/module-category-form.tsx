"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ModuleCategory, ModuleCategoryInput } from "../lib/module-store";
import { useModuleCategoryStore } from "../lib/module-store";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  identifier: z.string().min(1, "Identifiant requis"),
  description: z.string().optional(),
  visible: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  category?: ModuleCategory | null;
  onDone?: () => void;
};

export function ModuleCategoryForm({ category, onDone }: Props) {
  const { addCategory, updateCategory } = useModuleCategoryStore();

  const defaults = useMemo<FormValues>(
    () => ({
      name: category?.name ?? "",
      identifier: category?.identifier ?? "",
      description: category?.description ?? "",
      visible: category?.visible ?? true,
    }),
    [category],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const visible = form.watch("visible");

  const onSubmit = (values: FormValues) => {
    const input: ModuleCategoryInput = {
      name: values.name,
      identifier: values.identifier,
      description: values.description ?? "",
      visible: values.visible,
    };
    if (category) {
      updateCategory(category.id, input);
      toast.success("Catégorie mise à jour");
    } else {
      addCategory(input);
      toast.success("Catégorie créée");
    }
    form.reset({ name: "", identifier: "", description: "", visible: true });
    onDone?.();
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nom</Label>
            <Input
              id="cat-name"
              placeholder="Formation"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-identifier">Identifiant</Label>
            <Input
              id="cat-identifier"
              placeholder="formation"
              {...form.register("identifier")}
            />
            {form.formState.errors.identifier && (
              <p className="text-xs text-destructive">
                {form.formState.errors.identifier.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 col-span-2">
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
              className="data-[state=checked]:bg-(--color-primary)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cat-desc">Description</Label>
          <Textarea
            id="cat-desc"
            rows={3}
            placeholder="Description de la catégorie…"
            {...form.register("description")}
          />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-(--color-primary) hover:bg-(--color-primary)/80"
        >
          {category ? "Sauvegarder" : "Créer la catégorie"}
        </Button>
      </div>
    </form>
  );
}
