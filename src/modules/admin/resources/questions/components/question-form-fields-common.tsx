'use client';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
import type { FormValues } from './question-form-data';
import { ChevronDown, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommonFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsCommon({ form }: CommonFieldsProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { data: modulesData, isLoading: isLoadingModules } = useModules({ page_size: 200 });
  const modules = modulesData?.data ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="flex flex-col gap-4 ">
        <FieldRoot
          control={form.control}
          name="competencyId"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Module *</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={isLoadingModules}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un module…" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.shortname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
        <FieldRoot
          control={form.control}
          name="question"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Question *</FieldLabel>
              <FieldContent>
                <Textarea
                  autoFocus
                  aria-label="Question"
                  className="min-h-24 resize-y text-foreground/80"
                  {...field}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
        <div className="rounded-lg border mt-2">
          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-muted-foreground" />

              <div>
                <p className="text-xs font-medium">Commentaires</p>
                <p className="text-xs text-muted-foreground">Ajouter des commentaires optionnels</p>
              </div>
            </div>

            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                commentsOpen && 'rotate-180',
              )}
            />
          </button>

          {commentsOpen && (
            <div className="space-y-4 border-t px-4 py-4">
              <FieldRoot
                control={form.control}
                name="commentIfCorrect"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">
                      Commentaire affiché si la réponse est correcte
                    </FieldLabel>

                    <FieldContent>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        aria-label="Commentaire si correct"
                        className="min-h-16 resize-y text-foreground/70"
                      />
                    </FieldContent>

                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="commentIfIncorrect"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">
                      Commentaire affiché si la réponse est incorrecte
                    </FieldLabel>

                    <FieldContent>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        aria-label="Commentaire si incorrect"
                        className="min-h-16 resize-y text-foreground/70"
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
