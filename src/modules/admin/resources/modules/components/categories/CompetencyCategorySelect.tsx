'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { useCompetencyCategoriesQuery } from '../../hooks/useCompetencyCategoriesQuery';
import { useCreateCompetencyCategory } from '../../hooks/useCreateCompetencyCategory';
import { generateIdnumberFromName } from './category-idnumber';

interface CompetencyCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  onCreate?: () => void;
  disabled?: boolean;
}

export function CompetencyCategorySelect({
  value,
  onChange,
  disabled = false,
}: CompetencyCategorySelectProps) {
  const { data: categories = [], isLoading } = useCompetencyCategoriesQuery();
  const createCategory = useCreateCompetencyCategory();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label="Catégorie"
            disabled={disabled}
            className="h-9 w-full justify-between font-normal text-xs"
          >
            {value ? categories.find((c) => c.id === value)?.name : 'Sélectionner une catégorie'}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command>
            <CommandInput
              placeholder="Rechercher ou créer…"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>{isLoading ? 'Chargement...' : 'Aucune catégorie trouvée.'}</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      onChange(category.id);
                      setSearchValue('');
                      setOpen(false);
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            'size-4',
                            value === category.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span>{category.name}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchValue.trim() && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={async () => {
                        try {
                          const result = await createCategory.mutateAsync({
                            name: searchValue.trim(),
                            idnumber: generateIdnumberFromName(searchValue.trim()),
                            description: '',
                            visible: true,
                          });
                          onChange(result.id);
                          setSearchValue('');
                          setOpen(false);
                          toast.success('Catégorie créée');
                        } catch {
                          toast.error('Erreur lors de la création de la catégorie');
                        }
                      }}
                    >
                      <Plus className="mr-2 size-4" />
                      Créer « {searchValue.trim()} »
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
