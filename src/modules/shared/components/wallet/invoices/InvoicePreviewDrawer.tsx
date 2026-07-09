'use client';

import { useEffect, useState } from 'react';
import { Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/modules/shared/lib/wallet-utils';
import type { InvoiceDetail, InvoiceRequest } from '@/modules/shared/lib/wallet-types';
import { REQUEST_STATUS_CONFIG } from '@/modules/shared/lib/wallet-types';
import { mockInvoiceDetail, mockCreditInvoiceDetail } from '@/modules/shared/lib/wallet-mock-data';
import { InvoiceDetailsTable } from './InvoiceDetailsTable';
import { CreditInvoiceForm } from './CreditInvoiceForm';
import { useRequestStore } from '@/modules/shared/lib/request-store';

interface InvoicePreviewDrawerProps<T extends { ref?: string; pdfUrl?: string }> {
  invoice: T | null;
  detail?: InvoiceDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: InvoiceRequest | null;
  readonly?: boolean;
}

export function InvoicePreviewDrawer<T extends { ref?: string; pdfUrl?: string }>({
  invoice,
  detail,
  open,
  onOpenChange,
  request,
  readonly = false,
}: InvoicePreviewDrawerProps<T>) {
  const data = detail ?? mockInvoiceDetail;
  const resolveRequest = useRequestStore((s) => s.resolveRequest);
  const requests = useRequestStore((s) => s.requests);
  const liveRequest = request ? (requests[request.invoiceRef] ?? null) : null;
  const [tenantResponse, setTenantResponse] = useState('');
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  const [creditQuantity, setCreditQuantity] = useState(1);

  const creditDetail = mockCreditInvoiceDetail;

  useEffect(() => {
    if (open) {
      setTenantResponse('');
      setCreditFormOpen(false);
      setCreditQuantity(1);
    }
  }, [open, request?.invoiceRef]);

  const handleAccept = () => {
    if (!liveRequest || !tenantResponse.trim()) return;
    resolveRequest(liveRequest.invoiceRef, 'accepted', tenantResponse.trim());
  };

  const handleReject = () => {
    if (!liveRequest || !tenantResponse.trim()) return;
    resolveRequest(liveRequest.invoiceRef, 'rejected', tenantResponse.trim());
  };

  const isPending = liveRequest?.status === 'pending';
  const isAccepted = liveRequest?.status === 'accepted';
  const isRejected = liveRequest?.status === 'rejected';
  const showResolutionActions = isPending && !readonly;
  const showCreditForm = creditFormOpen;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`
          flex flex-col gap-0 p-0 data-[side=right]:w-full bg-background
          ${
            liveRequest
              ? 'data-[side=right]:sm:max-w-[calc(theme(maxWidth.3xl)*1.25)]'
              : 'data-[side=right]:sm:max-w-3xl'
          }
        `}
        showCloseButton={true}
      >
        <SheetHeader className="shrink-0 border-b bg-muted/20 px-5 py-4 sm:px-6">
          <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
            {invoice?.ref ?? data.ref}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {liveRequest && (
            <div className="w-full shrink-0 space-y-5 overflow-y-auto border-b bg-muted/20 p-5 sm:p-6 lg:w-80 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Demande de {liveRequest.type}
                </p>
                <Badge
                  variant={REQUEST_STATUS_CONFIG[liveRequest.status].badgeVariant}
                  className={REQUEST_STATUS_CONFIG[liveRequest.status].badgeClassName}
                >
                  {REQUEST_STATUS_CONFIG[liveRequest.status].label}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {liveRequest.description}
                  <br />
                  <span>Le {new Date(liveRequest.createdAt).toLocaleDateString('fr-FR')}</span>
                </p>
              </div>

              {liveRequest.tenantResponse && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Réponse
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {liveRequest.tenantResponse}
                    </p>
                  </div>
                </>
              )}

              {showResolutionActions && (
                <div className="space-y-3 pt-2">
                  <Textarea
                    value={tenantResponse}
                    onChange={(e) => setTenantResponse(e.target.value)}
                    placeholder="Votre réponse..."
                    rows={3}
                    className="text-xs shadow-sm focus-visible:ring-(--color-primary)"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/90"
                      disabled={!tenantResponse.trim()}
                      onClick={handleAccept}
                    >
                      <Check className="size-3.5" />
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      disabled={!tenantResponse.trim()}
                      onClick={handleReject}
                    >
                      <X className="size-3.5" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}

              {isAccepted && !creditFormOpen && !readonly && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/90"
                    onClick={() => setCreditFormOpen(true)}
                  >
                    Créer un avoir
                  </Button>
                </div>
              )}

              {isRejected && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  Cette demande a été rejetée. Aucun avoir n'a été généré.
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-background">
            <div className="space-y-7 p-5 sm:p-6 lg:p-8">
              {showCreditForm ? (
                <CreditInvoiceForm
                  detail={creditDetail}
                  quantity={creditQuantity}
                  onQuantityChange={setCreditQuantity}
                  readonly={readonly}
                  onCancel={() => setCreditFormOpen(false)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-bold text-muted-foreground shadow-sm">
                        LOGO
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right text-xs">
                      <p>
                        <span className="font-semibold">Référence Facture :</span> {data.ref}
                      </p>
                      <p>
                        <span className="font-semibold">Date :</span> {data.date}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
                      <p className="font-semibold text-xs">Société Vendeur</p>
                      <Separator />
                      <p>
                        <span className="font-semibold">Nom :</span> {data.seller.name}
                      </p>
                      <p>
                        <span className="font-semibold">Adresse :</span> {data.seller.address}
                      </p>
                      <p>
                        <span className="font-semibold">E-mail :</span> {data.seller.email}
                      </p>
                      <p>
                        <span className="font-semibold">Téléphone :</span> {data.seller.phone}
                      </p>
                    </div>

                    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
                      <p className="font-semibold text-xs">Facturé à</p>
                      <Separator />
                      <p>
                        <span className="font-semibold">Nom :</span> {data.buyer.name}
                      </p>
                      <p>
                        <span className="font-semibold">Adresse :</span> {data.buyer.address}
                      </p>
                      <p>
                        <span className="font-semibold">E-mail :</span> {data.buyer.email}
                      </p>
                      <p>
                        <span className="font-semibold">Téléphone :</span> {data.buyer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold">Détails de la facture</p>
                    <InvoiceDetailsTable items={data.items} variant="drawer" />
                  </div>

                  <div className="flex justify-end">
                    <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-right text-xs shadow-sm">
                      <p className="flex items-center justify-between gap-4 sm:min-w-52">
                        <span className="text-muted-foreground">Montant HT :</span>{' '}
                        <span className="font-medium">{formatCurrency(data.amountHT)}</span>
                      </p>
                      <p className="flex items-center justify-between gap-4 sm:min-w-52">
                        <span className="text-muted-foreground">Montant TTC :</span>{' '}
                        <span className="font-semibold">{formatCurrency(data.amountTTC)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
                    <p className="font-semibold text-xs">Mode de paiement</p>
                    <ul className="space-y-1.5">
                      {data.paymentMethods.map((pm, index) => (
                        <li key={index} className="flex justify-between">
                          <span className="font-medium">{pm.label} :</span>
                          <span>{formatCurrency(pm.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t bg-background px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-sm transition-all hover:bg-muted"
            disabled={!invoice?.pdfUrl || invoice.pdfUrl === '#'}
            asChild={!!(invoice?.pdfUrl && invoice.pdfUrl !== '#')}
          >
            {invoice?.pdfUrl && invoice.pdfUrl !== '#' ? (
              <a href={invoice.pdfUrl} download>
                <Download className="size-3.5" />
                Télécharger PDF
              </a>
            ) : (
              <>
                <Download className="size-3.5" />
                Télécharger PDF
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
