"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import type { MutationLike } from "./use-quiz-form-drawer";

export interface QuizFormDrawerContentProps {
  form: UseFormReturn<any>;
  open: boolean;
  onClose: () => void;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  genSlugFn: (title: string) => string;
  extractApiErrorFn: (err: unknown, isEdit: boolean) => string;
  extraFields?: ReactNode;
  drawerTitle: string;
}

export function QuizFormDrawerContent({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  genSlugFn,
  extractApiErrorFn,
  extraFields,
  drawerTitle,
}: QuizFormDrawerContentProps) {
  return (
    <SheetContent
      className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <SheetHeader className="border-b px-4 py-4">
        <SheetTitle>{drawerTitle}</SheetTitle>
          <SheetDescription>
            Renseignez les informations pour le quiz.
          </SheetDescription>
      </SheetHeader>
      <Field {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col"
            noValidate
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              {mutation.isError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {extractApiErrorFn(mutation.error, isEdit)}
                </div>
              )}

              <FieldRoot
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Titre *</FieldLabel>
                    <FieldContent>
                      <Input
                        autoFocus
                        aria-label="Titre"
                        className="h-9 px-3 text-sm"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!isEdit) {
                            form.setValue("slug", genSlugFn(e.target.value));
                          }
                        }}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>ID Quiz</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-label="ID Quiz"
                        className="h-9 px-3 text-sm bg-muted"
                        readOnly
                        {...field}
                      />
                    </FieldContent>
                    <p className="text-xs text-muted-foreground">
                      Généré automatiquement à partir du titre.
                    </p>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="isFinalEvaluation"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Évaluation finale</FieldLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "true")}
                      value={String(field.value)}
                    >
                      <FieldContent>
                        <SelectTrigger
                          size="default"
                          aria-label="Évaluation finale"
                          className="w-full"
                        >
                          <SelectValue placeholder="Choisir…" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        <SelectItem value="false">Non</SelectItem>
                        <SelectItem value="true">Oui</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="formationId"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Formation</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FieldContent>
                        <SelectTrigger
                          size="default"
                          aria-label="Formation"
                          className="w-full"
                        >
                          <SelectValue placeholder="Sélectionner une formation" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {MOCK_COURSES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              {extraFields}

              <FieldRoot
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Description</FieldLabel>
                    <FieldContent>
                      <Textarea
                        aria-label="Description"
                        className="min-h-24 resize-y text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
                size="lg"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending} size="lg" className="bg-(--color-primary) hover:bg-(--color-primary)/80">
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {mutation.isPending
                  ? isEdit
                    ? "Enregistrement…"
                    : "Création…"
                  : isEdit
                    ? "Enregistrer"
                    : "Créer"}
              </Button>
            </div>
          </form>
        </Field>
    </SheetContent>
  );
}
