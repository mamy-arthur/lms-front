import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { MutationLike } from "./use-user-form-drawer";

function extractApiError(err: unknown, isEdit: boolean): string {
  if (err && typeof err === "object") {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === "object") {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return isEdit
    ? "Une erreur est survenue lors de la modification."
    : "Une erreur est survenue lors de la création.";
}

export interface UserFormDrawerContentProps {
  form: UseFormReturn<any>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  title: string;
  roleLabels: Record<string, string>;
  lastLogin?: string;
  extraFields?: ReactNode;
}

export function UserFormDrawerContent({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  showPassword,
  togglePasswordVisibility,
  title,
  roleLabels,
  lastLogin,
  extraFields,
}: UserFormDrawerContentProps) {
  return (
    <SheetContent
      className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
      showCloseButton={true}
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <SheetHeader className="border-b px-4 py-4">
        <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Renseignez les informations de l'utilisateur.
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
                {extractApiError(mutation.error, isEdit)}
              </div>
            )}

            <FieldRoot
              control={form.control}
              name="last_name"
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
              name="first_name"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Prénom</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Prénom"
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
              name="username"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Nom d'utilisateur</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Nom d'utilisateur"
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
              name="email"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Email</FieldLabel>
                  <FieldContent>
                    <Input
                      type="email"
                      aria-label="Email"
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
              name="role"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Rôle</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FieldContent>
                      <SelectTrigger
                        size="default"
                        aria-label="Rôle"
                        className="w-full"
                      >
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FieldContent>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="city"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Ville</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Ville"
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
              name="country"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Pays</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Pays"
                      className="h-9 px-3 text-sm"
                      {...field}
                    />
                  </FieldContent>
                  <FieldError />
                </FieldGroup>
              )}
            />

            {isEdit && lastLogin && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Dernière connexion
                </span>
                <span className="text-sm text-foreground">
                  {new Date(lastLogin).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            <FieldRoot
              control={form.control}
              name="password"
              render={({ field }) => (
                <FieldGroup>
                  <FieldLabel>Mot de passe</FieldLabel>
                  <FieldContent>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        aria-label="Mot de passe"
                        className="h-9 px-3 pr-10 text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
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
