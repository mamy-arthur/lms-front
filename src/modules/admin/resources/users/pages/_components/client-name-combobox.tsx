'use client';

import { Check, ChevronsUpDown, Plus, RefreshCw } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
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
import { useClientNameQuery, type Client } from '@/modules/admin/resources/clients';

export interface ClientNameComboboxProps extends Pick<
  ComponentProps<'button'>,
  'id' | 'aria-invalid' | 'aria-describedby' | 'ref' | 'name' | 'onBlur'
> {
  clients: Client[];
  tenantId: string | null;
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
  tenantId,
  isLoading = false,
  disabled = false,
  clientId,
  clientName,
  onSelectExisting,
  onUseNewName,
  ...controlProps
}: ClientNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const query = search.trim();
  const resolution = useClientNameQuery(query, tenantId, open && !disabled && !isLoading);
  const resolved =
    query !== '' && !resolution.isResolving && !resolution.isError ? resolution.data : undefined;
  const matches =
    query === ''
      ? clients
      : (resolved?.clients.filter(
          (client) =>
            client.slug.includes(resolved.slug) ||
            client.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        ) ?? []);
  const existingWithSameName = resolved?.clients.find((client) => client.slug === resolved.slug);
  const invalidName = (resolution.error as { status?: number } | null)?.status === 422;

  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : undefined;

  const label = selectedClient?.name ?? clientName ?? null;

  const select = (client: Client) => {
    onSelectExisting(client);
    setSearch('');
    setOpen(false);
  };

  const createWithTypedName = () => {
    if (!resolved) return;
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
      <Popover
        open={open && !disabled && !isLoading}
        onOpenChange={(next) => {
          if (disabled || isLoading) return;
          setOpen(next);
          if (!next) setSearch('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            {...controlProps}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open && !disabled && !isLoading}
            aria-label="Client"
            disabled={disabled || isLoading}
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
              {query && resolution.isResolving ? (
                <p role="status" className="p-3 text-xs text-muted-foreground">
                  Vérification du nom…
                </p>
              ) : query && resolution.isError ? (
                <div className="space-y-2 p-3">
                  <p role="alert" className="text-xs text-destructive">
                    {invalidName
                      ? 'Ce nom de client est invalide.'
                      : 'Impossible de vérifier ce nom de client.'}
                  </p>
                  {!invalidName && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resolution.isFetching}
                      onClick={() => void resolution.refetch()}
                    >
                      <RefreshCw className="size-3.5" />
                      Réessayer
                    </Button>
                  )}
                </div>
              ) : matches.length === 0 ? (
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
              {resolved && !existingWithSameName ? (
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
            ? `Le client « ${label} » sera créé s’il n’existe pas déjà dans ce tenant.`
            : 'Saisissez un nom pour rechercher un client existant, ou en créer un nouveau.'}
      </p>
    </div>
  );
}
