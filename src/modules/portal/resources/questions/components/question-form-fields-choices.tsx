"use client";

import { Plus, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
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
import type { QuestionType } from "../types";

interface ChoicesFieldsProps {
  form: UseFormReturn<any>;
  selectedType: QuestionType;
}

export const QuestionFormFieldsChoices = React.memo(
  function QuestionFormFieldsChoices({
    form,
    selectedType,
  }: ChoicesFieldsProps) {
    const {
      fields: optionFields,
      append: appendOption,
      remove: removeOption,
    } = useFieldArray({
      control: form.control,
      name: "options",
    });

    const handleScoreChange = useCallback(
      (index: number, value: number) => {
        const clamped = Math.min(100, Math.max(0, value));
        form.setValue(`options.${index}.score`, clamped);
        form.setValue(`options.${index}.isCorrect`, clamped >= 100);

        if (selectedType === "single_choice" && clamped >= 100) {
          optionFields.forEach((_, i) => {
            if (i !== index) {
              form.setValue(`options.${i}.score`, 0);
              form.setValue(`options.${i}.isCorrect`, false);
            }
          });
        }
      },
      [form, selectedType, optionFields],
    );

    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium">Choix</h4>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              appendOption({
                id: `opt-${Date.now()}-${Math.random()}`,
                label: "",
                isCorrect: false,
                score: 0,
                feedback: "",
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Ajouter plus de choix
          </Button>
        </div>

        {optionFields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun choix. Cliquez sur "Ajouter".
          </p>
        ) : (
          <div className="space-y-3">
            {optionFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Choix {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>

                <FieldRoot
                  control={form.control}
                  name={`options.${index}.label`}
                  render={({ field: f }) => (
                    <FieldGroup className="space-y-2">
                      <FieldLabel className="text-xs">Libellé *</FieldLabel>
                      <FieldContent>
                        <Input aria-label={`Libellé ${index + 1}`} {...f} />
                      </FieldContent>
                      <FieldError />
                    </FieldGroup>
                  )}
                />

                {selectedType === "single_choice" ? (
                  <FieldRoot
                    control={form.control}
                    name={`options.${index}.score`}
                    render={({ field: f }) => (
                      <FieldGroup className="space-y-2">
                        <FieldLabel className="text-xs">Note</FieldLabel>
                        <FieldContent>
                          <Button
                            type="button"
                            variant={f.value >= 100 ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              handleScoreChange(
                                index,
                                f.value >= 100 ? 0 : 100,
                              )
                            }
                            className="w-full"
                          >
                            {f.value >= 100 ? "100" : "0"}
                          </Button>
                        </FieldContent>
                        <FieldError />
                      </FieldGroup>
                    )}
                  />
                ) : (
                  <FieldRoot
                    control={form.control}
                    name={`options.${index}.score`}
                    render={({ field: f }) => (
                      <FieldGroup className="space-y-2">
                        <FieldLabel className="text-xs">Note</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            aria-label={`Note ${index + 1}`}
                            value={f.value}
                            onChange={(e) =>
                              handleScoreChange(
                                index,
                                Number(e.target.value),
                              )
                            }
                          />
                        </FieldContent>
                        <FieldError />
                      </FieldGroup>
                    )}
                  />
                )}

                <FieldRoot
                  control={form.control}
                  name={`options.${index}.feedback`}
                  render={({ field: f }) => (
                    <FieldGroup className="space-y-2">
                      <FieldLabel className="text-xs">Feedback</FieldLabel>
                      <FieldContent>
                        <Input aria-label={`Feedback ${index + 1}`} {...f} />
                      </FieldContent>
                      <FieldError />
                    </FieldGroup>
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {form.formState.errors.options && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {String(form.formState.errors.options.message ?? "")}
          </p>
        )}
      </div>
    );
  },
);
