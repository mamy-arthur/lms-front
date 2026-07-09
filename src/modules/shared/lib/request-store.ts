'use client';

import { create } from 'zustand';
import type { InvoiceRequest } from './wallet-types';

interface RequestStore {
  requests: Record<string, InvoiceRequest>;
  addRequest: (invoiceRef: string, type: string, description: string) => void;
  resolveRequest: (
    invoiceRef: string,
    resolution: 'accepted' | 'rejected',
    tenantResponse: string,
  ) => void;
  getRequest: (invoiceRef: string) => InvoiceRequest | undefined;
}

const mockRequests: Record<string, InvoiceRequest> = {
  'FACT-2026-0001': {
    invoiceRef: 'FACT-2026-0001',
    type: 'Remboursement',
    description:
      "Bonjour, je souhaite demander un remboursement pour cette facture car le service n'a pas été fourni correctement. Merci.",
    status: 'pending',
    createdAt: '2026-07-01T10:30:00Z',
  },
  'FACT-2026-0002': {
    invoiceRef: 'FACT-2026-0002',
    type: 'Remboursement',
    description:
      'Suite à un doublon de paiement, je demande le remboursement de 6 000 €. Merci de traiter ma demande dans les plus brefs délais.',
    status: 'accepted',
    createdAt: '2026-06-28T14:15:00Z',
    tenantResponse:
      'Bonjour, nous acceptons votre demande de remboursement. Un avoir va être généré.',
  },
  'FACT-2026-0003': {
    invoiceRef: 'FACT-2026-0003',
    type: 'Remboursement',
    description:
      'Je conteste le montant de cette facture, le service rendu ne correspond pas à ce qui a été convenu.',
    status: 'rejected',
    createdAt: '2026-06-25T09:00:00Z',
    tenantResponse:
      'Bonjour, après examen, nous ne pouvons pas donner suite à votre demande. Le service a bien été fourni conformément au contrat.',
  },
};

export const useRequestStore = create<RequestStore>((set, get) => ({
  requests: mockRequests,
  addRequest: (invoiceRef, type, description) =>
    set((state) => ({
      requests: {
        ...state.requests,
        [invoiceRef]: {
          invoiceRef,
          type,
          description,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      },
    })),
  resolveRequest: (invoiceRef, resolution, tenantResponse) =>
    set((state) => {
      const request = state.requests[invoiceRef];
      if (!request || request.status !== 'pending') return state;
      return {
        requests: {
          ...state.requests,
          [invoiceRef]: {
            ...request,
            status: resolution,
            tenantResponse,
          },
        },
      };
    }),
  getRequest: (invoiceRef) => get().requests[invoiceRef],
}));
