import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ContentTypeField } from '@/shared/types/content-type.types';
import { RichTextField } from './fields/RichTextField';
import { MediaSingleField } from './fields/MediaSingleField';
import { MediaMultiField } from './fields/MediaMultiField';

interface DynamicFieldProps {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
  contentTypeId: string;
}

export function DynamicField({ field, value, onChange, contentTypeId }: DynamicFieldProps) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'richtext':
      return (
        <RichTextField
          value={value}
          onChange={onChange}
          label={field.label}
          contentTypeId={contentTypeId}
          fieldId={field.field_id}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.field_id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <label htmlFor={field.field_id} className="text-sm">
            {field.label}
          </label>
        </div>
      );

    case 'media':
      return field.multiple ? (
        <MediaMultiField
          field={field}
          value={value}
          onChange={onChange}
          contentTypeId={contentTypeId}
        />
      ) : (
        <MediaSingleField
          field={field}
          value={value}
          onChange={onChange}
          contentTypeId={contentTypeId}
        />
      );

    case 'select':
    case 'relation':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    default:
      return null;
  }
}
