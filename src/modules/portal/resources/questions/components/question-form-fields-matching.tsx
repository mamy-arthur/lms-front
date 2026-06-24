"use client";

import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
interface MatchingFieldsProps {
  form: UseFormReturn<any>;
}

export const QuestionFormFieldsMatching = React.memo(
  function QuestionFormFieldsMatching({ form }: MatchingFieldsProps) {
    const {
      fields: pairFields,
      append: appendPair,
      remove: removePair,
    } = useFieldArray({
      control: form.control,
      name: "pairs",
    });

    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium">Paires question/réponse</h4>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              appendPair({
                id: `pair-${Date.now()}-${Math.random()}`,
                question: "",
                answer: "",
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Ajouter une paire
          </Button>
        </div>

        {pairFields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune paire. Cliquez sur "Ajouter une paire".
          </p>
        ) : (
          <div className="space-y-3">
            {pairFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Paire {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={() => removePair(index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>

                <FieldRoot
                  control={form.control}
                  name={`pairs.${index}.question`}
                  render={({ field: f }) => (
                    <FieldGroup className="space-y-2">
                      <FieldLabel className="text-xs">Question *</FieldLabel>
                      <FieldContent>
                        <Input aria-label={`Question ${index + 1}`} {...f} />
                      </FieldContent>
                      <FieldError />
                    </FieldGroup>
                  )}
                />

                <FieldRoot
                  control={form.control}
                  name={`pairs.${index}.answer`}
                  render={({ field: f }) => (
                    <FieldGroup className="space-y-2">
                      <FieldLabel className="text-xs">Réponse *</FieldLabel>
                      <FieldContent>
                        <Input aria-label={`Réponse ${index + 1}`} {...f} />
                      </FieldContent>
                      <FieldError />
                    </FieldGroup>
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {form.formState.errors.pairs && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {String(form.formState.errors.pairs.message ?? "")}
          </p>
        )}
      </div>
    );
  },
);
