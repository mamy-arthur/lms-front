"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
interface TrueFalseFieldsProps {
  form: UseFormReturn<any>;
}

export const QuestionFormFieldsTrueFalse = React.memo(
  function QuestionFormFieldsTrueFalse({ form }: TrueFalseFieldsProps) {
    return (
      <div className="rounded-lg border p-4">
        <h4 className="text-xs font-medium mb-3">Configuration Vrai/Faux</h4>
        <div className="space-y-3">
          <FieldRoot
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">Réponse correcte</FieldLabel>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={field.value === true}
                      onChange={() => form.setValue("correctAnswer", true)}
                      className="accent-primary"
                    />
                    Vrai
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={field.value === false}
                      onChange={() => form.setValue("correctAnswer", false)}
                      className="accent-primary"
                    />
                    Faux
                  </label>
                </div>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="feedbackTrue"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">
                  Feedback pour "Vrai"
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Feedback Vrai"
                    className="min-h-16 resize-y"
                    {...field}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="feedbackFalse"
            render={({ field }) => (
              <FieldGroup className="space-y-2">
                <FieldLabel className="text-xs">
                  Feedback pour "Faux"
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    aria-label="Feedback Faux"
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
    );
  },
);
