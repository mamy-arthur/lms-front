'use client';

import {
  Type,
  AlignJustify,
  FileEdit,
  Hash,
  CalendarDays,
  ListFilter,
  SquareCheck,
  ImageIcon,
  Link2,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  UploadCloud,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldType } from '../../../types';

// ─── Per-type config ──────────────────────────────────────────────────────────

interface FieldTypeConfig {
  icon: LucideIcon;
  label: string;
  description: string;
  preview: React.ReactNode;
}

const CONFIGS: Record<FieldType, FieldTypeConfig> = {
  text: {
    icon: Type,
    label: 'Texte',
    description: 'Texte court sur une ligne',
    preview: (
      <Input disabled placeholder="Mon texte…" className="h-7 text-xs pointer-events-none" />
    ),
  },
  textarea: {
    icon: AlignJustify,
    label: 'Zone de texte',
    description: 'Texte long sur plusieurs lignes',
    preview: (
      <Textarea
        disabled
        placeholder="Texte long…"
        rows={2}
        className="text-xs resize-none min-h-0 pointer-events-none"
      />
    ),
  },
  richtext: {
    icon: FileEdit,
    label: 'Texte riche',
    description: 'Éditeur avec mise en forme avancée',
    preview: (
      <div className="border rounded-md overflow-hidden text-xs">
        <div className="flex gap-0.5 border-b px-1 py-0.5 bg-muted/50">
          <Button
            size="icon"
            variant="ghost"
            className="size-5"
            tabIndex={-1}
            disabled
            aria-hidden="true"
          >
            <Bold className="size-2.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-5"
            tabIndex={-1}
            disabled
            aria-hidden="true"
          >
            <Italic className="size-2.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-5"
            tabIndex={-1}
            disabled
            aria-hidden="true"
          >
            <Underline className="size-2.5" />
          </Button>
        </div>
        <div className="px-2 py-1 text-[10px] text-muted-foreground leading-snug">
          Lorem ipsum dolor sit amet…
        </div>
      </div>
    ),
  },
  number: {
    icon: Hash,
    label: 'Nombre',
    description: 'Valeur numérique entière ou décimale',
    preview: (
      <Input
        type="number"
        disabled
        value={42}
        onChange={() => {}}
        className="h-7 text-xs pointer-events-none"
      />
    ),
  },
  date: {
    icon: CalendarDays,
    label: 'Date',
    description: 'Sélecteur de date',
    preview: (
      <Button
        variant="outline"
        className="w-full h-7 text-xs justify-start font-normal pointer-events-none"
        tabIndex={-1}
        disabled
        aria-hidden="true"
      >
        <CalendarDays className="size-3 mr-1.5 shrink-0" />
        <span className="text-muted-foreground">jj / mm / aaaa</span>
      </Button>
    ),
  },
  select: {
    icon: ListFilter,
    label: 'Sélection',
    description: "Liste déroulante d'options prédéfinies",
    preview: (
      <div className="flex items-center border rounded-md px-2 h-7 text-xs text-muted-foreground gap-1 bg-background">
        <span className="flex-1">Option 1</span>
        <ChevronDown className="size-3 shrink-0" />
      </div>
    ),
  },
  checkbox: {
    icon: SquareCheck,
    label: 'Case à cocher',
    description: 'Valeur booléenne vrai / faux',
    preview: (
      <div className="flex items-center gap-1.5">
        <Checkbox checked onCheckedChange={() => {}} disabled />
        <span className="text-xs text-muted-foreground">Activé</span>
      </div>
    ),
  },
  media: {
    icon: ImageIcon,
    label: 'Média',
    description: 'Fichier, image ou vidéo uploadé',
    preview: (
      <div className="border-2 border-dashed rounded-md p-2 text-center">
        <UploadCloud className="size-4 mx-auto text-muted-foreground mb-0.5" />
        <p className="text-[10px] text-muted-foreground leading-snug">Glisser un fichier</p>
      </div>
    ),
  },
  relation: {
    icon: Link2,
    label: 'Relation',
    description: 'Lien vers une autre entité du projet',
    preview: (
      <div className="flex items-center border rounded-md px-2 h-7 text-xs text-muted-foreground gap-1 bg-background">
        <Link2 className="size-3 shrink-0 mr-0.5" />
        <span className="flex-1">Choisir une entité…</span>
        <ChevronDown className="size-3 shrink-0" />
      </div>
    ),
  },
};

// Preserve canonical ordering from FIELD_TYPES
const FIELD_TYPE_ORDER: FieldType[] = ['text', 'textarea', 'richtext', 'number', 'date', 'media'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface FieldTypePickerProps {
  value: FieldType;
  onChange: (value: FieldType) => void;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FieldTypePicker({ value, onChange, disabled = false }: FieldTypePickerProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5',
        disabled && 'pointer-events-none',
      )}
    >
      {FIELD_TYPE_ORDER.map((fieldType) => {
        const config = CONFIGS[fieldType];
        const Icon = config.icon;
        const isSelected = value === fieldType;

        return (
          <div
            key={fieldType}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onChange(fieldType)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onChange(fieldType);
              }
            }}
            className={cn(
              'relative flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-(--color-primary) bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-muted/20',
              disabled && !isSelected && 'opacity-40',
              disabled ? 'cursor-default' : 'cursor-pointer',
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-(--color-primary)">
                <Check className="size-2.5 text-primary-foreground" />
              </span>
            )}

            {/* Header: icon + label */}
            <div className="flex items-center gap-1.5 pr-5">
              <Icon
                className={cn(
                  'size-3.5 shrink-0',
                  isSelected ? 'text-(--color-primary)' : 'text-muted-foreground',
                )}
              />
              <span className="text-xs font-semibold leading-none">{config.label}</span>
            </div>

            {/* Preview (non-interactive) */}
            <div className="pointer-events-none select-none" aria-hidden="true">
              {config.preview}
            </div>

            {/* Description */}
            <p className="text-[10px] leading-snug text-muted-foreground">{config.description}</p>
          </div>
        );
      })}
    </div>
  );
}
