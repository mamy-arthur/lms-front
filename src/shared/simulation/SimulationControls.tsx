'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Loader2, LogOut, ScanEye } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { endSimulation, startSimulation } from './service';
import { SIMULATION_ROLE_LABELS, useSimulationStore } from './simulation.store';

/** Radix refuse une valeur vide sur un item ; on repasse à '' au moment du submit. */
const CURRENT_TENANT = '__current__';

export function SimulationControls() {
  const router = useRouter();
  const realUser = useAuthStore((s) => s.user);
  const simulatedRole = useAuthStore((s) => s.simulatedRole);
  const session = useSimulationStore((s) => s.session);
  const phase = useSimulationStore((s) => s.phase);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role | ''>('');
  const [tenantId, setTenantId] = useState('');
  const [exiting, setExiting] = useState(false);
  if (!realUser || realUser.role === Role.TRAINEE) return null;

  const exit = async () => {
    setExiting(true);
    try {
      router.replace(await endSimulation());
    } catch {
      toast.error('La sortie n’a pas pu être confirmée. La simulation reste isolée.');
    } finally {
      setExiting(false);
    }
  };

  const activeRole = session?.simulated_role ?? simulatedRole;
  if (activeRole) {
    const roleLabel = SIMULATION_ROLE_LABELS[activeRole];
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-sm border-amber-100 bg-amber-100 text-amber-600 hover:bg-amber-200/50 hover:text-amber-500"
        aria-label={`Quitter la simulation du rôle ${roleLabel}`}
        onClick={() => void exit()}
        disabled={exiting || phase !== 'ready'}
      >
        <ScanEye className="size-3" aria-hidden="true" />
        <span className="font-normal">{roleLabel}</span>
        <span className="h-3.5 w-px bg-amber-300" aria-hidden="true" />
        {exiting ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="size-3" aria-hidden="true" />
        )}
        {exiting ? 'Sortie…' : 'Quitter'}
      </Button>
    );
  }

  if (!session?.allowed_roles.length) return null;

  let simulationNotice =
    'Seule la Boutique affiche des données réelles. Aucun paiement ne sera effectué.';
  if (realUser.role === Role.CLIENT_MANAGER) {
    simulationNotice =
      'Seules les formations que vous avez achetées seront visibles dans la simulation stagiaire.';
  } else if (realUser.role === Role.EDITOR) {
    simulationNotice =
      role === Role.TRAINEE
        ? 'Seules les formations que vous avez publiées seront visibles dans la simulation stagiaire.'
        : 'Seules les formations publiées seront présentes dans la Boutique. Aucun paiement ne sera effectué.';
  }

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
        <Button variant="outline" size="sm" className="h-7 rounded-sm">
          <ScanEye className="size-4" />
          Simuler un rôle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-4 overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simuler un rôle</DialogTitle>
          <DialogDescription className="text-xs">
            Explorez l’application avec des données fictives. Les actions et achats ne seront pas
            enregistrés et sont perdus si vous rechargez ou fermez la page. Votre compte reste
            connecté.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="simulation-role" className="text-xs font-medium">
            Rôle à simuler
          </Label>
          <Select value={role} onValueChange={(value) => setRole(value as Role)}>
            <SelectTrigger id="simulation-role" className="h-10 w-full">
              <SelectValue placeholder="Choisir un rôle" />
            </SelectTrigger>
            <SelectContent>
              {session.allowed_roles.map((value) => (
                <SelectItem key={value} value={value}>
                  {SIMULATION_ROLE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {realUser.role === Role.SUPER_ADMIN && session.shop_tenants.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="simulation-tenant" className="text-sm font-medium">
              Catalogue réel de la Boutique
            </Label>
            <Select
              value={tenantId || CURRENT_TENANT}
              onValueChange={(value) => setTenantId(value === CURRENT_TENANT ? '' : value)}
            >
              <SelectTrigger id="simulation-tenant" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CURRENT_TENANT}>
                  Contexte courant (vide sur le domaine central)
                </SelectItem>
                {session.shop_tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Alert
          aria-live="polite"
          className="rounded-sm bg-amber-100 border-amber-300 text-amber-800"
        >
          <Info aria-hidden="true" />
          <AlertDescription className="text-amber-800">{simulationNotice}</AlertDescription>
        </Alert>
        <Button
          className="h-9 rounded-sm bg-(--color-primary) hover:bg-(--color-primary)/80"
          onClick={() => void start()}
          disabled={!role || phase !== 'ready'}
        >
          Démarrer la simulation
        </Button>
      </DialogContent>
    </Dialog>
  );
}
