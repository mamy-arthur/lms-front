"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"

const Field = FormProvider

type FieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FieldContext = React.createContext<FieldContextValue>(
  {} as FieldContextValue,
)

function FieldRoot<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FieldContext.Provider>
  )
}

const useFieldContext = () => {
  const fieldContext = React.use(FieldContext)
  const itemContext = React.use(FieldItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext.name) {
    throw new Error("useFieldContext should be used within <FieldRoot>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    fieldItemId: `${id}-field-item`,
    fieldDescriptionId: `${id}-field-item-description`,
    fieldErrorId: `${id}-field-item-error`,
    ...fieldState,
  }
}

type FieldItemContextValue = {
  id: string
}

const FieldItemContext = React.createContext<FieldItemContextValue>(
  {} as FieldItemContextValue,
)

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FieldItemContext.Provider value={{ id }}>
      <div
        data-slot="field-group"
        className={cn("space-y-1", className)}
        {...props}
      />
    </FieldItemContext.Provider>
  )
}

function FieldLegend({
  className,
  ...props
}: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="field-legend"
      className={cn(
        "text-sm font-medium text-foreground select-none",
        className,
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  const { fieldItemId } = useFieldContext()

  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-sm font-medium text-foreground select-none",
        className,
      )}
      htmlFor={fieldItemId}
      {...props}
    />
  )
}

function FieldContent({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, fieldItemId, fieldDescriptionId, fieldErrorId } =
    useFieldContext()

  return (
    <Slot.Root
      data-slot="field-content"
      id={fieldItemId}
      aria-describedby={
        !error
          ? fieldDescriptionId
          : `${fieldDescriptionId} ${fieldErrorId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { fieldDescriptionId } = useFieldContext()

  return (
    <p
      data-slot="field-description"
      id={fieldDescriptionId}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { error, fieldErrorId } = useFieldContext()
  const body = error ? String(error.message) : children

  if (!body) return null

  return (
    <p
      data-slot="field-error"
      id={fieldErrorId}
      className={cn("text-xs text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

function FieldTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="field-title"
      className={cn(
        "text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  className,
  ...props
}: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="field-separator"
      className={cn("my-2 h-px bg-border/50", className)}
      {...props}
    />
  )
}

export {
  Field,
  FieldRoot,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
