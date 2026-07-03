'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Client } from './types';
import { ClientList } from './ClientList';
import { ClientDetailsSheet } from './ClientDetailsSheet';
import { topClients } from './data/data';

export default function TopClientsCard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const selectedRank = selectedClient
    ? topClients.findIndex((client) => client.id === selectedClient.id)
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Top 5 Clients</CardTitle>

            <p className="mt-0.5 text-xs text-muted-foreground">Par chiffre d'affaires</p>
          </div>

          <Button variant="ghost" size="sm">
            Voir tous
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>

        <ClientList clients={topClients} onSelect={setSelectedClient} />
      </Card>

      <ClientDetailsSheet
        client={selectedClient}
        rank={selectedRank}
        onClose={() => setSelectedClient(null)}
      />
    </>
  );
}
