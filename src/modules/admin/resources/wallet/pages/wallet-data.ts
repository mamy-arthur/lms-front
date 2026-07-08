import type { WalletRecipient } from '@/modules/shared/lib/wallet-types';

export const recipients: WalletRecipient[] = [
  {
    id: 'r1',
    name: 'Camille Dupont',
    email: 'camille.dupont@example.com',
    balance: 12_400,
    nonRefundableBalance: 1_200,
  },
  {
    id: 'r2',
    name: 'Lucas Martin',
    email: 'lucas.martin@example.com',
    balance: 9_250,
    nonRefundableBalance: 550,
  },
  {
    id: 'r3',
    name: 'Sofia Moreau',
    email: 'sofia.moreau@example.com',
    balance: 3_860,
    nonRefundableBalance: 0,
  },
];
