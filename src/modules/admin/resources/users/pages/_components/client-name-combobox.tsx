'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Client } from '@/modules/admin/resources/clients';

/**
 * Reprend l'identite d'un Client cote backend (Slug::fromString) : « Acme Corp »
 * et « ACME corp. » designent le meme client. Sans cette normalisation, l'ecran
 * proposerait de creer un doublon que le backend refuserait de creer.
 */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ClientNameComboboxProps {
  clients: Client[];
  isLoading?: boolean;
  disabled?: boolean;
  /** Client existant retenu, null tant que le nom saisi n'en designe aucun. */
  clientId: string | null;
  clientName: string | null;
  onSelectExisting: (client: Client) => void;
  onUseNewName: (name: string) => void;
}

export function ClientNameCombobox({
  clients,
  isLoading = false,
  disabled = false,
  clientId,
  clientName,
  onSelectExisting,
  onUseNewName,
}: ClientNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const query = search.trim();
  const querySlug = slugify(query);

  const matches = useMemo(
    () => (querySlug === '' ? clients : clients.filter((c) => slugify(c.name).includes(querySlug))),
    [clients, querySlug],
  );

  const existingWithSameName = useMemo(
    () => (querySlug === '' ? undefined : clients.find((c) => slugify(c.name) === querySlug)),
    [clients, querySlug],
  );

  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : undefined;

  const label = selectedClient?.name ?? clientName ?? null;

  const select = (client: Client) => {
    onSelectExisting(client);
    setSearch('');
    setOpen(false);
  };

  const createWithTypedName = () => {
    if (existingWithSameName) {
      select(existingWithSameName);
      return;
    }

    onUseNewName(query);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Client"
            disabled={disabled}
            className="w-full justify-between font-normal text-xs"
          >
            <span className={cn('truncate', !label && 'text-muted-foreground')}>
              {label ?? 'Rechercher ou créer un client'}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput placeholder="Nom du client…" value={search} onValueChange={setSearch} />
            <CommandList>
              {matches.length === 0 ? (
                <CommandEmpty>
                  {isLoading ? 'Chargement…' : 'Aucun client existant ne correspond.'}
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Clients existants">
                  {matches.map((client) => (
                    <CommandItem key={client.id} value={client.id} onSelect={() => select(client)}>
                      <Check
                        className={cn(
                          'size-4',
                          clientId === client.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{client.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {query && !existingWithSameName ? (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem value="__create__" onSelect={createWithTypedName}>
                      <Plus className="size-4" />
                      <span className="truncate">Créer le client « {query} »</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-[11px] text-muted-foreground">
        {selectedClient
          ? 'Le responsable rejoint ce client existant.'
          : label
            ? `Le client « ${label} » sera créé dans ce tenant.`
            : 'Saisissez un nom pour rechercher un client existant, ou en créer un nouveau.'}
      </p>
    </div>
  );
}
