'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { WalletRecipient } from '@/modules/shared/lib/wallet-types';

interface WalletTransferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: WalletRecipient[];
}

export function WalletTransferDrawer({
  open,
  onOpenChange,
  recipients,
}: WalletTransferDrawerProps) {
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipients[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [showRecipientBalance, setShowRecipientBalance] = useState(true);

  const recipientOptions = useMemo(
    () =>
      recipients.filter((recipient) =>
        `${recipient.name} ${recipient.email}`
          .toLowerCase()
          .includes(recipientSearch.toLowerCase()),
      ),
    [recipientSearch, recipients],
  );

  const selectedRecipient =
    recipients.find((recipient) => recipient.id === selectedRecipientId) || recipients[0];
  const amountValue = Number(amount || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0" showCloseButton={true}>
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Transférer des points</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 p-6">
          {/* Destinataire : recherche + sélection fusionnées dans un combobox unique */}
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Popover open={recipientPickerOpen} onOpenChange={setRecipientPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left hover:bg-muted/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {selectedRecipient?.name ?? 'Choisir un destinataire'}
                    </p>
                    {selectedRecipient && (
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedRecipient.email}
                      </p>
                    )}
                  </div>
                  <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Nom ou email"
                    value={recipientSearch}
                    onValueChange={setRecipientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Aucun destinataire trouvé.</CommandEmpty>
                    <CommandGroup>
                      {recipientOptions.map((recipient) => (
                        <CommandItem
                          key={recipient.id}
                          value={recipient.id}
                          onSelect={() => {
                            setSelectedRecipientId(recipient.id);
                            setRecipientPickerOpen(false);
                          }}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{recipient.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {recipient.email}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              'size-4',
                              recipient.id === selectedRecipientId ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Montant : le solde du destinataire est intégré comme sous-texte, plus de carte séparée */}
          <div className="space-y-2">
            <Label>Point à transférer</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                step={50}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                POINT
              </span>
            </div>
          </div>

          {/* Toggle discret, sans carte ni description */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              checked={showRecipientBalance}
              onCheckedChange={setShowRecipientBalance}
              className="data-[state=checked]:bg-(--color-primary)"
            />
            Afficher le solde du destinataire
          </label>
          {showRecipientBalance && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Solde disponible du destinataire :</span>
                <span className="font-medium">{selectedRecipient.balance} POINTS</span>
              </div>

              <div className="flex justify-between">
                <span>Solde non remboursable du destinataire :</span>
                <span className="font-medium">{selectedRecipient.nonRefundableBalance} POINTS</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-auto w-full text-foreground sm:w-[220px]"
            >
              Annuler
            </Button>
            <Button
              disabled={!selectedRecipient || amountValue <= 0}
              className="h-auto w-full whitespace-normal bg-(--color-primary) p-2 text-white hover:bg-(--color-primary) sm:w-[220px]"
            >
              <span className="line-clamp-2 text-center flex items-center gap-2">
                {amountValue > 0 && selectedRecipient
                  ? `Envoyer ${amountValue} points à ${selectedRecipient.name}`
                  : 'Envoyer'}
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
