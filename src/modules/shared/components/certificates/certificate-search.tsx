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
  const isMounted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    timerRef.current = setTimeout(() => onSearchRef.current(), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
          if (e.key === 'Enter') {
            if (timerRef.current) clearTimeout(timerRef.current);
            onSearch();
          }
        }}
        className="pl-9"
      />
    </div>
  );
}
