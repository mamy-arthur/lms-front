'use client';

import { useCallback, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WalletSummaryCards } from '@/modules/shared/components/wallet/WalletSummaryCards';
import { WalletTransactionsTable } from '@/modules/shared/components/wallet/WalletTransactionsTable';
import { TransactionHistoryFilter } from '@/modules/shared/components/wallet/WalletTransactionHistoryFilter';
import { WalletTabs, type WalletTab } from '@/modules/shared/components/wallet/WalletTabs';
import { InvoiceTabContent } from '@/modules/shared/components/wallet/invoices/InvoiceTabContent';
import { InvoiceFilters } from '@/modules/shared/components/wallet/invoices/InvoiceFilters';
import { useWalletTransactionsQuery } from '@/modules/shared/hooks/useWalletTransactionsQuery';
import { useWalletController } from '@/modules/shared/hooks/useWalletController';
import { WalletTransferDrawer } from './_components/WalletTransferDrawer';
import { recipients } from './wallet-data';
import { invoices } from './invoice-data';
import type { Invoice } from '../types';

const TABS: WalletTab[] = [
  { id: 'wallet', label: 'Portefeuille' },
  { id: 'invoice', label: 'Facturation' },
];

export function WalletPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = searchParams.get('tab') === 'invoice' ? 'invoice' : 'wallet';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const ctrl = useWalletController();
  const { data, isLoading } = useWalletTransactionsQuery(ctrl.params);

  const walletBalances = {
    totalPoints: 24800,
    principalBalance: 32450,
    nonRefundableBalance: 5950,
  } as const;

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
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portefeuille</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === 'wallet'
                ? "Suivez le solde et l'historique des transactions dans votre portefeuille."
                : 'Consultez et gérez vos factures.'}
            </p>
          </div>
          {activeTab === 'wallet' && (
            <Button
              onClick={() => setDrawerOpen(true)}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
            >
              Transférer des points
            </Button>
          )}
        </header>

        <WalletTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {activeTab === 'wallet' ? (
          <>
            <div className="space-y-4">
              <div className="min-h-112.5 space-y-3">
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div className="flex min-w-max flex-col items-start gap-2 sm:min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="shrink-0">
                      <h2 className="text-base font-semibold">Historiques des transactions</h2>
                      <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                        Suivez l'historique des transactions dans votre portefeuille.
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                      <div className="w-full overflow-x-auto sm:w-auto sm:overflow-visible">
                        <div>
                          <WalletSummaryCards {...walletBalances} />
                        </div>
                      </div>
                      <div className="self-end sm:self-auto">
                        <TransactionHistoryFilter onApplyFilters={ctrl.handleApplyFilters} />
                      </div>
                    </div>
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
            </div>
          </>
        ) : (
          <div className="min-h-112.5 space-y-3">
            <div className="flex flex-row items-center justify-between pb-2">
              <div>
                <h2 className="text-base font-semibold">Factures</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Consultez et téléchargez vos documents de facturation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InvoiceFilters onApplyFilters={() => {}} />
              </div>
            </div>
            <div>
              <InvoiceTabContent
                invoices={invoices}
                readonly={false}
                clientColumn={{
                  key: 'client',
                  label: 'Client',
                  sortable: true,
                  render: (row: Invoice) => (
                    <div className="text-xs text-muted-foreground">{row.client}</div>
                  ),
                }}
              />
            </div>
          </div>
        )}
      </div>

      <WalletTransferDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipients={recipients}
      />
    </div>
  );
}
