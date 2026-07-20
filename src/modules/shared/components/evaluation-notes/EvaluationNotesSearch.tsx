'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface EvaluationNotesSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EvaluationNotesSearch({
  value,
  onChange,
  placeholder = 'Rechercher un stagiaire',
}: EvaluationNotesSearchProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
