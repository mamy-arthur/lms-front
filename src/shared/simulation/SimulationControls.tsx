'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanEye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { startSimulation } from './service';
import { SIMULATION_ROLE_LABELS, useSimulationStore } from './simulation.store';

export function SimulationControls() {
  const router = useRouter();
  const realUser = useAuthStore((s) => s.user);
  const session = useSimulationStore((s) => s.session);
  const phase = useSimulationStore((s) => s.phase);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role | ''>('');
  const [tenantId, setTenantId] = useState('');
  if (
    !realUser ||
    realUser.role === Role.TRAINEE ||
    session?.simulated_role ||
    !session?.allowed_roles.length
  )
    return null;

  const start = async () => {
    if (!role) return;
    try {
      const destination = await startSimulation(role, tenantId);
      setOpen(false);
      router.replace(destination);
    } catch {
      toast.error('Impossible de démarrer cette simulation.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ScanEye className="size-4" />
          Simuler un rôle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simuler un rôle</DialogTitle>
          <DialogDescription>
            Explorez l’application avec des données fictives. Les actions et achats ne seront pas
            enregistrés. Votre compte reste connecté.
          </DialogDescription>
        </DialogHeader>
        <label className="grid gap-2 text-sm font-medium">
          Rôle à simuler
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="" disabled>
              Choisir un rôle
            </option>
            {session.allowed_roles.map((value) => (
              <option key={value} value={value}>
                {SIMULATION_ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {realUser.role === Role.SUPER_ADMIN && session.shop_tenants.length > 0 && (
          <label className="grid gap-2 text-sm font-medium">
            Catalogue réel de la Boutique
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">Contexte courant (vide sur le domaine central)</option>
              {session.shop_tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="text-sm text-muted-foreground">
          Seule la Boutique affiche des données réelles. Aucun paiement ne sera effectué.
        </p>
        <Button onClick={() => void start()} disabled={!role || phase !== 'ready'}>
          Démarrer la simulation
        </Button>
      </DialogContent>
    </Dialog>
  );
}
