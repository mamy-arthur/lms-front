'use client';

import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

export interface CertificateSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  debounceMs?: number;
}

export function CertificateSearch({
  value,
  onChange,
  onSearch,
  debounceMs = 400,
}: CertificateSearchProps) {
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    const timer = setTimeout(() => onSearchRef.current(), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Rechercher par nom…"
        aria-label="Rechercher une attestation"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch();
        }}
        className="pl-9"
      />
    </div>
  );
}
