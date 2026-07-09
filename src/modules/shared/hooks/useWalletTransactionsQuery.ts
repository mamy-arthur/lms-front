import { useQuery } from '@tanstack/react-query';
import type { WalletTransaction, WalletTransactionSearchParams } from '../lib/wallet-types';
import { transactions } from '../lib/wallet-mock-data';

interface WalletTransactionsResponse {
  data: WalletTransaction[];
  total: number;
}

export const WALLET_TRANSACTIONS_QUERY_KEY = ['wallet', 'transactions'] as const;

export function useWalletTransactionsQuery(_params?: WalletTransactionSearchParams) {
  void _params;
  return useQuery({
    queryKey: [...WALLET_TRANSACTIONS_QUERY_KEY],
    queryFn: async () => {
      return { data: transactions, total: transactions.length } as WalletTransactionsResponse;
    },
    placeholderData: (prev) => prev,
  });
}
