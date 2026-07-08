'use client';

import { useController, type Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ContentTypeFormValues } from '../../../validation';

interface MediaOptionsProps {
  index: number;
  control: Control<ContentTypeFormValues>;
}

const COMMON_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
];

export function MediaOptions({ index, control }: MediaOptionsProps) {
  const { field: acceptField } = useController({
    name: `fields.${index}.accept`,
    control,
  });
  const { field: maxSizeField } = useController({
    name: `fields.${index}.max_size_mb`,
    control,
  });
  const { field: multipleField } = useController({
    name: `fields.${index}.multiple`,
    control,
  });

  const accept: string[] = acceptField.value ?? [];

  const toggleMime = (mime: string) => {
    if (accept.includes(mime)) {
      acceptField.onChange(accept.filter((m) => m !== mime));
    } else {
      acceptField.onChange([...accept, mime]);
    }
  };

  return (
    <div className="space-y-4 rounded-md border border-dashed p-4 bg-muted/30">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Options Média
      </p>

      {/* MIME Types */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Types MIME autorisés</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_MIME_TYPES.map((mime) => (
            <button key={mime} type="button" onClick={() => toggleMime(mime)}>
              <Badge
                variant={accept.includes(mime) ? 'default' : 'outline'}
                className="cursor-pointer select-none transition-colors"
              >
                {mime}
              </Badge>
            </button>
          ))}
        </div>
        {accept.length > 0 && (
          <p className="text-xs text-muted-foreground">{accept.length} type(s) sélectionné(s)</p>
        )}
      </div>

      {/* Max size */}
      <div className="flex items-center gap-3">
        <div className="space-y-1.5 flex-1 max-w-[160px]">
          <label
            htmlFor={`field-max-size-${index}`}
            className="text-sm font-medium"
          >
            Taille maximale (Mo)
          </label>
          <Input
            id={`field-max-size-${index}`}
            type="number"
            min={0}
            placeholder="Ex : 5"
            value={maxSizeField.value ?? ''}
            onChange={(e) =>
              maxSizeField.onChange(e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
      </div>

      {/* Multiple */}
      <div className="flex items-center gap-2">
        <Switch
          id={`field-multiple-${index}`}
          checked={multipleField.value ?? false}
          onCheckedChange={multipleField.onChange}
        />
        <label
          htmlFor={`field-multiple-${index}`}
          className="text-sm font-medium cursor-pointer"
        >
          Autoriser l&apos;upload multiple
        </label>
      </div>
    </div>
  );
}
