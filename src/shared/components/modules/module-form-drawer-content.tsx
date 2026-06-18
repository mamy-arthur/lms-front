import { Check, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/shared/constants/modules";
import type { extractApiError, genIdentifier } from "./module-form-utils";
import type { MutationLike } from "./use-module-form-drawer";

interface Course {
  id: string;
  fullName: string;
  categoryId: string;
}

interface CourseCategory {
  name: string;
  courses: Course[];
}

export interface ModuleFormDrawerContentProps {
  form: UseFormReturn<any>;
  open: boolean;
  onClose: () => void;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  selectedCourseIds: string[];
  toggleCourse: (courseId: string) => void;
  coursesByCategory: CourseCategory[];
  openCategories: Set<string>;
  toggleCategory: (name: string) => void;
  name: string;
  coursePopoverOpen: boolean;
  setCoursePopoverOpen: (open: boolean) => void;
  title: string;
  genIdentifierFn: typeof genIdentifier;
  extractApiErrorFn: typeof extractApiError;
  extraFields?: ReactNode;
}

export function ModuleFormDrawerContent({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  selectedCourseIds,
  toggleCourse,
  coursesByCategory,
  openCategories,
  toggleCategory,
  name,
  coursePopoverOpen,
  setCoursePopoverOpen,
  title,
  genIdentifierFn,
  extractApiErrorFn,
  extraFields,
}: ModuleFormDrawerContentProps) {
  return (
    <SheetContent
      className="sm:max-w-lg"
      showCloseButton={false}
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
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
              name="name"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Nom</FieldLabel>
                  <FieldContent>
                    <Input
                      autoFocus
                      aria-label="Nom"
                      className="h-9 px-3 text-sm"
                      {...field}
                    />
                  </FieldContent>
                  <FieldError />
                </FieldGroup>
              )}
            />

            <FieldRoot
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Identifiant</FieldLabel>
                  <FieldContent>
                    <div className="flex gap-2">
                      <Input
                        aria-label="Identifiant"
                        className="h-9 px-3 text-sm flex-1"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          form.setValue(
                            "identifier",
                            genIdentifierFn(name),
                            { shouldValidate: true },
                          )
                        }
                      >
                        Auto
                      </Button>
                    </div>
                  </FieldContent>
                  <FieldError />
                </FieldGroup>
              )}
            />

            <FieldRoot
              control={form.control}
              name="category"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Catégorie</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FieldContent>
                      <SelectTrigger
                        size="default"
                        aria-label="Catégorie"
                        className="w-full"
                      >
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FieldContent>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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

            <FieldRoot
              control={form.control}
              name="courseIds"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Cours liés</FieldLabel>
                  <Popover
                    open={coursePopoverOpen}
                    onOpenChange={setCoursePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FieldContent>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-label="Cours liés"
                          className="h-9 w-full justify-between font-normal"
                        >
                          {selectedCourseIds.length > 0
                            ? `${selectedCourseIds.length} cours sélectionné${
                                selectedCourseIds.length > 1 ? "s" : ""
                              }`
                            : "Sélectionner des cours…"}

                          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                        </Button>
                      </FieldContent>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      className="w-[--radix-popover-trigger-width] p-0"
                    >
                      <Command className="overflow-hidden">
                        <CommandInput placeholder="Rechercher un cours..." />

                        <CommandEmpty>
                          Aucun cours trouvé.
                        </CommandEmpty>

                        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                          {coursesByCategory.map(({ name, courses }) => {
                            const isOpen = openCategories.has(name);

                            return (
                              <CommandGroup key={name}>
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(name)}
                                  className="flex w-full items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-3 transition-transform",
                                      !isOpen && "-rotate-90",
                                    )}
                                  />
                                  {name}
                                </button>

                                {isOpen &&
                                  courses.map((course) => (
                                    <CommandItem
                                      key={course.id}
                                      value={course.fullName}
                                      onSelect={() => toggleCourse(course.id)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 size-4",
                                          selectedCourseIds.includes(course.id)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {course.fullName}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            );
                          })}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <FieldError />
                </FieldGroup>
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
              size="lg"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending} 
              size="lg"
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              >
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