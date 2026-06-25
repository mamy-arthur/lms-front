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
    <div className="rounded-lg bg-muted/40 min-h-full flex flex-col">
      <div className="rounded-lg border bg-background p-4 flex-1">
        <h4 className="text-xs font-medium mb-3">Configuration Vrai/Faux</h4>
        <div className="space-y-3">
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
                      variant={field.value === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => form.setValue("correctAnswer", true)}
                      className={
                        field.value === true
                          ? "gap-1.5 text-white bg-(--color-primary) hover:bg-(--color-primary)/80"
                          : "gap-1.5"
                      }
                    >
                      {field.value === true && <Check className="size-3.5" />}
                      Vrai
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => form.setValue("correctAnswer", false)}
                      className={
                        field.value === false
                          ? "gap-1.5 text-white bg-(--color-primary) hover:bg-(--color-primary)/80"
                          : "gap-1.5"
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
              <FieldGroup className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                <FieldLabel className="text-xs">
                  Feedback pour réponse correcte
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Feedback pour réponse correcte"
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
              <FieldGroup className="space-y-2 rounded-md border p-3">
                <FieldLabel className="text-xs">
                  Feedback pour réponse incorrecte
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Feedback pour réponse incorrecte"
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
