'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

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

function localSuggestions(query: string, country: string | null | undefined): LocationIQResult[] {
  if (!country || query.length < MIN_LENGTH) return [];
  return ['rue de la Démonstration', 'avenue des Exemples', 'allée du Campus fictif'].map(
    (road, i) => ({
      place_id: `demo-address-${i}`,
      display_name: `${i + 1} ${road}, 00000 Ville fictive (${country}) — démonstration`,
      address: {
        house_number: String(i + 1),
        road,
        postcode: '00000',
        city: 'Ville fictive',
        country_code: country.toLowerCase(),
      },
    }),
  );
}

function networkBlocked() {
  const phase = useSimulationStore.getState().phase;
  return !!useAuthStore.getState().simulatedRole || (phase !== 'idle' && phase !== 'ready');
}

function parseResult(result: LocationIQResult): PlaceDetails {
  const addr = result.address ?? {};
  return {
    address: [addr.house_number, addr.road].filter(Boolean).join(' ') || null,
    zip_code: addr.postcode ?? null,
    city: addr.city ?? addr.town ?? addr.village ?? null,
    country: addr.country_code ? addr.country_code.toUpperCase() : null,
  };
}

async function fetchSuggestions(
  query: string,
  country: string,
  signal: AbortSignal,
): Promise<LocationIQResult[]> {
  if (networkBlocked() || signal.aborted) return [];
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
    signal,
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
  const simulatedRole = useAuthStore((s) => s.simulatedRole);
  const previousRole = useRef(simulatedRole);
  const phase = useSimulationStore((s) => s.phase);
  const transitioning = phase !== 'idle' && phase !== 'ready';

  // Internal search query — only updated when the user actually types.
  // Keeps the displayed value (prop) decoupled from what triggers the search,
  // so loading an existing address from the API never fires a request.
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search — depends on searchQuery, NOT on the value prop
  useEffect(() => {
    setIsLoading(false);
    setSuggestions([]);

    if (previousRole.current !== simulatedRole) {
      previousRole.current = simulatedRole;
      setSearchQuery('');
      setOpen(false);
      return;
    }

    if (transitioning || !country || searchQuery.length < MIN_LENGTH) {
      setOpen(false);
      return;
    }

    if (simulatedRole) {
      setOpen(true);
      return;
    }

    const controller = new AbortController();
    const abortIfBlocked = () => {
      if (networkBlocked()) controller.abort();
    };
    const unsubscribeAuth = useAuthStore.subscribe(abortIfBlocked);
    const unsubscribeSimulation = useSimulationStore.subscribe(abortIfBlocked);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (networkBlocked() || controller.signal.aborted) return;
      setIsLoading(true);
      timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const results = await fetchSuggestions(searchQuery, country, controller.signal);
        if (!controller.signal.aborted && !networkBlocked()) {
          setSuggestions(results);
          setOpen(results.length > 0);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
      unsubscribeAuth();
      unsubscribeSimulation();
    };
  }, [searchQuery, country, simulatedRole, transitioning]);

  // Never display results from a real request after switching to a demo persona.
  const visibleSuggestions = transitioning
    ? []
    : simulatedRole
      ? localSuggestions(searchQuery, country)
      : suggestions;

  const handleSelect = (result: LocationIQResult) => {
    const details = parseResult(result);
    onChange(details.address ?? result.display_name.split(',')[0].trim());
    onSelectSuggestion(details);
    setSuggestions([]);
    setOpen(false);
    setSearchQuery(''); // reset so next typing starts fresh
  };

  return (
    <Popover open={open && visibleSuggestions.length > 0} onOpenChange={setOpen}>
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
          {visibleSuggestions.map((s, i) => (
            <li
              key={`${s.place_id}-${i}`}
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
