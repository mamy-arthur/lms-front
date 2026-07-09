'use client';

import { useController, type Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ImageIcon, Film, Music, FileText, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentTypeFormValues } from '../../../validation';

interface MediaOptionsProps {
  index: number;
  control: Control<ContentTypeFormValues>;
}

// ─── MIME type groups ─────────────────────────────────────────────────────────

const MIME_GROUPS = [
  {
    label: 'Images',
    icon: ImageIcon,
    color: 'text-rose-500',
    types: [
      { value: 'image/png', label: 'PNG' },
      { value: 'image/jpeg', label: 'JPEG' },
      { value: 'image/webp', label: 'WebP' },
      { value: 'image/gif', label: 'GIF' },
      { value: 'image/svg+xml', label: 'SVG' },
    ],
  },
  {
    label: 'Vidéo',
    icon: Film,
    color: 'text-violet-500',
    types: [
      { value: 'video/mp4', label: 'MP4' },
      { value: 'video/webm', label: 'WebM' },
    ],
  },
  {
    label: 'Audio',
    icon: Music,
    color: 'text-amber-500',
    types: [
      { value: 'audio/mpeg', label: 'MP3' },
      { value: 'audio/wav', label: 'WAV' },
    ],
  },
  {
    label: 'Documents',
    icon: FileText,
    color: 'text-blue-500',
    types: [{ value: 'application/pdf', label: 'PDF' }],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaOptions({ index, control }: MediaOptionsProps) {
  const { field: acceptField } = useController({ name: `fields.${index}.accept`, control });
  const { field: maxSizeField } = useController({ name: `fields.${index}.max_size_mb`, control });
  const { field: multipleField } = useController({ name: `fields.${index}.multiple`, control });

  const accept: string[] = acceptField.value ?? [];

  const toggleMime = (mime: string) => {
    acceptField.onChange(
      accept.includes(mime) ? accept.filter((m) => m !== mime) : [...accept, mime],
    );
  };

  const toggleGroup = (types: string[]) => {
    const allSelected = types.every((t) => accept.includes(t));
    if (allSelected) {
      acceptField.onChange(accept.filter((m) => !types.includes(m)));
    } else {
      const toAdd = types.filter((t) => !accept.includes(t));
      acceptField.onChange([...accept, ...toAdd]);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/40">
        <Settings2 className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">
          Options Média
        </span>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* MIME type groups */}
        <div className="flex flex-col space-y-3">
          <Label className="text-xs">Types de fichiers autorisés</Label>
          <div className="space-y-2.5">
            {MIME_GROUPS.map((group) => {
              const Icon = group.icon;
              const allSelected = group.types.every((t) => accept.includes(t.value));
              const someSelected = group.types.some((t) => accept.includes(t.value));

              return (
                <div key={group.label} className="flex items-start gap-3">
                  {/* Group toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.types.map((t) => t.value))}
                    className={cn(
                      'flex items-center gap-1.5 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium border transition-colors w-24 justify-center',
                      allSelected
                        ? 'border-(--color-primary) bg-primary/10 text-(--color-primary)'
                        : someSelected
                          ? 'border-(--color-primary) bg-primary/10 text-(--color-primary)'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Icon
                      className={cn('size-3 shrink-0', allSelected ? 'text-primary' : group.color)}
                    />
                    {group.label}
                  </button>

                  {/* Individual type pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.types.map((type) => {
                      const isActive = accept.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => toggleMime(type.value)}
                          className={cn(
                            'rounded px-2 py-0.5 text-[12px] font-medium border transition-colors',
                            isActive
                              ? 'border-(--color-primary) bg-primary/10 text-(--color-primary)'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                          )}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Max size + Multiple */}
        <div className="flex items-end gap-6">
          <div className="space-x-2">
            <Label htmlFor={`field-max-size-${index}`}>Taille max (Mo)</Label>
            <Input
              id={`field-max-size-${index}`}
              type="number"
              min={0}
              placeholder="Ex : 5"
              className="w-28 h-8 text-xs"
              value={maxSizeField.value ?? ''}
              onChange={(e) =>
                maxSizeField.onChange(e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>

          <div className="flex items-center gap-2 pb-1">
            <Switch
              id={`field-multiple-${index}`}
              checked={multipleField.value ?? false}
              onCheckedChange={multipleField.onChange}
            />
            <Label htmlFor={`field-multiple-${index}`} className="font-normal cursor-pointer">
              Upload multiple
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
