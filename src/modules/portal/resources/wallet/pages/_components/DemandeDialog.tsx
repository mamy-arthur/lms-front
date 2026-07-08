import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceBase, InvoiceDetail } from '@/modules/shared/lib/wallet-types';
import { mockInvoiceDetail } from '@/modules/shared/lib/wallet-mock-data';
import { formatDate } from '@/shared/lib/date';
import { formatCurrency } from '@/modules/shared/lib/wallet-utils';
import { InvoiceDetailsTable } from '@/modules/shared/components/wallet/invoices/InvoiceDetailsTable';

export interface DemandeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceBase[];
  getDetailByRef?: (ref: string) => Promise<InvoiceDetail | null> | InvoiceDetail | null;
  onSubmit?: (data: {
    ref: string;
    type: string;
    description: string;
    invoice: InvoiceDetail | null;
  }) => void;
}

const REQUEST_TYPES = ['Remboursement', 'Correction', 'Autre'];

export function DemandeDialog({
  open,
  onOpenChange,
  invoices,
  getDetailByRef,
  onSubmit,
}: DemandeDialogProps) {
  const [ref, setRef] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [matchedInvoice, setMatchedInvoice] = useState<InvoiceDetail | null>(null);
  const [isResolvingDetail, setIsResolvingDetail] = useState(false);

  const normalizedRef = ref.trim();
  const existingInvoice = useMemo(
    () =>
      normalizedRef ? (invoices.find((invoice) => invoice.ref === normalizedRef) ?? null) : null,
    [invoices, normalizedRef],
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveDetail() {
      if (!existingInvoice) {
        setMatchedInvoice(null);
        setIsResolvingDetail(false);
        return;
      }
      setIsResolvingDetail(true);
      const resolvedDetail = (await getDetailByRef?.(existingInvoice.ref)) ?? {
        ...mockInvoiceDetail,
        id: existingInvoice.id,
        ref: existingInvoice.ref,
        date: existingInvoice.date,
        type: existingInvoice.type,
        pdfUrl: existingInvoice.pdfUrl,
        amountHT: existingInvoice.amountHT,
        amountTTC: existingInvoice.amountTTC,
      };
      if (cancelled) {
        return;
      }
      setMatchedInvoice(resolvedDetail);
      setIsResolvingDetail(false);
    }

    resolveDetail();
    return () => {
      cancelled = true;
    };
  }, [existingInvoice, getDetailByRef]);

  const items = matchedInvoice?.items ?? [];

  const handleClose = () => {
    setRef('');
    setType('');
    setDescription('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    onSubmit?.({ ref, type, description, invoice: matchedInvoice });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={
          matchedInvoice
            ? 'flex max-h-[85vh] w-full !max-w-4xl flex-col gap-0 p-0'
            : 'flex max-h-[85vh] w-full !max-w-lg flex-col gap-0 p-0'
        }
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Faire une demande</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div
            className={matchedInvoice ? 'grid grid-cols-1 gap-6 p-6 md:grid-cols-[38%_62%]' : 'p-6'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <Label htmlFor="demande-ref">Réf</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="demande-ref"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="INV-2026-0001"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <Label htmlFor="demande-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="demande-type" className="w-full">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                <Label htmlFor="demande-description" className="pt-2">
                  Description
                </Label>
                <Textarea
                  id="demande-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Décrivez votre demande..."
                />
              </div>

              {isResolvingDetail && existingInvoice && (
                <p className="text-xs text-muted-foreground">
                  Chargement des détails de la facture...
                </p>
              )}
            </div>

            {matchedInvoice && (
              <div className="space-y-4 md:border-l md:pl-6">
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs font-medium tracking-wide">
                      Date : {formatDate(matchedInvoice.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide">
                      Montant HT: {formatCurrency(matchedInvoice.amountHT)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide">
                      Client: {matchedInvoice.buyer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide">
                      Montant TTC: {formatCurrency(matchedInvoice.amountTTC)}
                    </p>
                  </div>
                </div>

                <div className="px-4 pt-2">
                  <p className="mb-3 text-xs font-medium">Détails de la facture</p>
                  <InvoiceDetailsTable items={items} variant="dialog" />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full text-foreground sm:w-[100px]"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!ref.trim() || !type}
            className="w-full bg-(--color-primary) text-white hover:bg-(--color-primary)/90 sm:w-[100px]"
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
