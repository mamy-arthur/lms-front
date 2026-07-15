'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FIELD_TYPES, type FieldType } from '../../../types';

interface FieldTypeSelectProps {
  value: FieldType;
  onChange: (value: FieldType) => void;
  disabled?: boolean;
}

export function FieldTypeSelect({ value, onChange, disabled }: FieldTypeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FieldType)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sélectionner un type" />
      </SelectTrigger>
      <SelectContent>
        {FIELD_TYPES.map((ft) => (
          <SelectItem key={ft.value} value={ft.value}>
            {ft.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
