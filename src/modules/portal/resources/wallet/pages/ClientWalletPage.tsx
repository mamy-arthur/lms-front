'use client';

import { useCallback, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WalletTransactionsTable } from '@/modules/shared/components/wallet/WalletTransactionsTable';
import { TransactionHistoryFilter } from '@/modules/shared/components/wallet/WalletTransactionHistoryFilter';
import { WalletTabs, type WalletTab } from '@/modules/shared/components/wallet/WalletTabs';
import { InvoiceTabContent } from '@/modules/shared/components/wallet/invoices/InvoiceTabContent';
import { InvoiceFilters } from '@/modules/shared/components/wallet/invoices/InvoiceFilters';
import { DemandeDialog } from './_components/DemandeDialog';
import { useWalletTransactionsQuery } from '@/modules/shared/hooks/useWalletTransactionsQuery';
import { useWalletController } from '@/modules/shared/hooks/useWalletController';
import { useRequestStore } from '@/modules/shared/lib/request-store';
import { WalletDepositDrawer } from './_components/WalletDepositDrawer';
import { invoices } from './invoice-data';
import type { ClientInvoice } from '../types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TABS: WalletTab[] = [
  { id: 'wallet', label: 'Portefeuille' },
  { id: 'invoice', label: 'Mes factures' },
];

export function ClientWalletPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = searchParams.get('tab') === 'invoice' ? 'invoice' : 'wallet';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [demandeOpen, setDemandeOpen] = useState(false);
  const addRequest = useRequestStore((s) => s.addRequest);
  const ctrl = useWalletController();
  const { data, isLoading } = useWalletTransactionsQuery(ctrl.params);

  const handleTabChange = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === 'wallet') {
        params.delete('tab');
      } else {
        params.set('tab', tabId);
      }
      const qs = params.toString();
      setDrawerOpen(false);
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="bg-background">
      <div>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portefeuille</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === 'wallet'
                ? "Suivez le solde et l'historique des transactions dans votre portefeuille."
                : 'Consultez vos factures.'}
            </p>
          </div>
        </header>
        <div className="mt-5">
          <WalletTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {activeTab === 'wallet' ? (
          <>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between w-full shrink-0 flex-col sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par référence ou client ..."
                    className="pl-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <TransactionHistoryFilter onApplyFilters={ctrl.handleApplyFilters} />
                  <Button
                    onClick={() => setDrawerOpen(true)}
                    className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                  >
                    Créditer mon portefeuille
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <WalletTransactionsTable
                  data={data?.data ?? []}
                  sort={ctrl.sort}
                  page={ctrl.page}
                  pageSize={ctrl.pageSize}
                  total={data?.total ?? 0}
                  hasQuery={ctrl.hasQuery}
                  isLoading={isLoading}
                  onSort={ctrl.handleSort}
                  onPageChange={ctrl.handlePageChange}
                  onPageSizeChange={ctrl.handlePageSizeChange}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="flex flex-row items-center justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence ou client ..."
                  className="pl-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <InvoiceFilters onApplyFilters={() => {}} />
                <Button
                  onClick={() => setDemandeOpen(true)}
                  className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                >
                  Faire une demande
                </Button>
              </div>
            </div>
            <div>
              <InvoiceTabContent
                invoices={invoices}
                clientColumn={{
                  key: 'tenant',
                  label: 'Société',
                  sortable: true,
                  render: (row: ClientInvoice) => (
                    <div className="text-xs text-muted-foreground">{row.tenant}</div>
                  ),
                }}
              />
            </div>
          </div>
        )}
      </div>

      <WalletDepositDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <DemandeDialog
        open={demandeOpen}
        onOpenChange={setDemandeOpen}
        invoices={invoices}
        onSubmit={(data) => {
          addRequest(data.ref, data.type, data.description);
        }}
      />
    </div>
  );
}
