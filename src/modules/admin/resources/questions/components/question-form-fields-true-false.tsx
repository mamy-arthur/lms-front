"use client";

import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { FormValues } from "./question-form-data";

interface TrueFalseFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsTrueFalse({ form }: TrueFalseFieldsProps) {
  const correctAnswer = form.watch("correctAnswer");

  const correctFieldName =
    correctAnswer === false ? "feedbackFalse" : "feedbackTrue";
  const incorrectFieldName =
    correctAnswer === false ? "feedbackTrue" : "feedbackFalse";

  return (
    <div className="flex h-full min-h-0 flex-col">
       <div className="mb-2 border-b border-border/10">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Réponses et explication
            </p>
            <p className="mt-2 text-xs text-foreground/80">
              Choisissez la bonne réponse et saisissez des explications personnalisés.
            </p>
          </div>
        </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background/95 p-4 ring-1 ring-border/10">
        <div className="space-y-4">
          <FieldRoot
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">Réponse correcte</FieldLabel>
                <FieldContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("correctAnswer", true)}
                      className={
                        field.value === true
                          ? "gap-1.5 text-muted-foreground border-(--color-primary) hover:border-(--color-primary)/80"
                          : "gap-1.5 text-muted-foreground"
                      }
                    >
                      {field.value === true && <Check className="size-3.5" />}
                      Vrai
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("correctAnswer", false)}
                      className={
                        field.value === false
                          ? "gap-1.5 text-muted-foreground border-(--color-primary) hover:border-(--color-primary)/80"
                          : "gap-1.5 text-muted-foreground"
                      }
                    >
                      {field.value === false && <Check className="size-3.5" />}
                      Faux
                    </Button>
                  </div>
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            key={correctFieldName}
            control={form.control}
            name={correctFieldName}
            render={({ field }) => (
              <FieldGroup className="space-y-2 rounded-3xl border-(--color-primary)/40 py-2">
                <FieldLabel className="text-xs">
                  Commentaire pour réponse correcte
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Commentaire pour réponse correcte"
                    className="min-h-16 resize-y"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            key={incorrectFieldName}
            control={form.control}
            name={incorrectFieldName}
            render={({ field }) => (
              <FieldGroup className="space-y-2 rounded-3xl bg-muted/10 py-2 ring-1 ring-border/10">
                <FieldLabel className="text-xs">
                  Commentaire pour réponse incorrecte
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Commentaire pour réponse incorrecte"
                    className="min-h-16 resize-y"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />
        </div>
      </div>
    </div>
  );
}
