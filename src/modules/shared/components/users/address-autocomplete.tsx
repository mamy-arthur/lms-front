'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface PlaceDetails {
  address: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
}

interface LocationIQResult {
  place_id: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country_code?: string;
  };
}

const DEBOUNCE_MS = 350;
const MIN_LENGTH = 2;
const MAX_RESULTS = 6;

function parseResult(result: LocationIQResult): PlaceDetails {
  const addr = result.address ?? {};
  return {
    address: [addr.house_number, addr.road].filter(Boolean).join(' ') || null,
    zip_code: addr.postcode ?? null,
    city: addr.city ?? addr.town ?? addr.village ?? null,
    country: addr.country_code ? addr.country_code.toUpperCase() : null,
  };
}

async function fetchSuggestions(query: string, country: string): Promise<LocationIQResult[]> {
  const key = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    key,
    q: query,
    limit: String(MAX_RESULTS),
    countrycodes: country.toLowerCase(),
    addressdetails: '1',
    format: 'json',
    'accept-language': 'fr',
  });

  const res = await fetch(`https://api.locationiq.com/v1/autocomplete?${params.toString()}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  return (await res.json()) as LocationIQResult[];
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (details: PlaceDetails) => void;
  country?: string | null;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  country,
  disabled,
  placeholder = 'Rechercher une adresse…',
  'aria-label': ariaLabel = 'Adresse',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQuery = useRef('');

  // Internal search query — only updated when the user actually types.
  // Keeps the displayed value (prop) decoupled from what triggers the search,
  // so loading an existing address from the API never fires a request.
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search — depends on searchQuery, NOT on the value prop
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!country || searchQuery.length < MIN_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const q = searchQuery;
      latestQuery.current = q;
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(q, country);
        if (latestQuery.current === q) {
          setSuggestions(results);
          setOpen(results.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        if (latestQuery.current === q) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery, country]);

  const handleSelect = (result: LocationIQResult) => {
    const details = parseResult(result);
    onChange(details.address ?? result.display_name.split(',')[0].trim());
    onSelectSuggestion(details);
    setSuggestions([]);
    setOpen(false);
    setSearchQuery(''); // reset so next typing starts fresh
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value); // update parent form
              setSearchQuery(e.target.value); // trigger debounced search
            }}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className="text-xs pr-8"
            autoComplete="off"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MapPin className="size-3.5" />
            )}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              role="option"
              aria-selected={false}
              className="flex cursor-pointer items-start gap-2 px-3 py-2 text-xs hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              <MapPin className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
              <span>{s.display_name}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
