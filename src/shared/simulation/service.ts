import { apiDelete, apiGet, apiPost } from '@/shared/lib/apiClient';
import { queryClient } from '@/shared/lib/query-client';
import { selectSessionIdentity, useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import {
  clearSimulationData,
  configureSimulationTraining,
  hasSimulationData,
  resetSimulationData,
} from './local-api';
import { cancelSimulationRequests } from './transport';
import { roleHome, type SimulationSession, useSimulationStore } from './simulation.store';

let checking: { identity: string | null; promise: Promise<boolean> } | null = null;

const currentIdentity = () => selectSessionIdentity(useAuthStore.getState());
let channel: BroadcastChannel | null = null;

function notifyOtherTabs() {
  if (typeof BroadcastChannel !== 'undefined') {
    channel ??= new BroadcastChannel('learneo-role-simulation');
    channel.postMessage('changed');
  }
}

async function isolate(phase: 'checking' | 'transition') {
  useSimulationStore.setState({ phase, error: null });
  cancelSimulationRequests();
  await queryClient.cancelQueries();
  queryClient.clear();
}

function applySession(session: SimulationSession) {
  const previous = useAuthStore.getState().simulatedRole;
  if (
    session.simulated_role !== previous ||
    (session.simulated_role && !hasSimulationData(session.simulated_role))
  ) {
    if (session.simulated_role) resetSimulationData(session.simulated_role);
    else clearSimulationData();
  }
  const { user, sessionId } = useAuthStore.getState();
  const trainingPreview =
    session.simulated_role === Role.TRAINEE &&
    (user?.role === Role.EDITOR || user?.role === Role.CLIENT_MANAGER);
  configureSimulationTraining(
    trainingPreview ? JSON.stringify([user!.id, user!.role, sessionId, session.tenant_id]) : null,
    apiGet,
  );
  useAuthStore.getState().setSimulatedRole(session.simulated_role);
  useSimulationStore.setState((state) => ({
    session,
    phase: 'ready',
    error: null,
    epoch: state.epoch + 1,
  }));
}

/**
 * Always verify the server before mounting any business screen (also after reload).
 *
 * Owned by the session identity current at call time: concurrent calls for the
 * same identity share one request, a new account/session starts its own, and a
 * superseded check never touches the store. Resolves true once this identity's
 * outcome (server state or error screen) has been applied, false if superseded.
 */
export function synchronizeSimulation(): Promise<boolean> {
  const identity = currentIdentity();
  if (checking && checking.identity === identity) return checking.promise;
  const run: NonNullable<typeof checking> = { identity, promise: Promise.resolve(false) };
  run.promise = (async () => {
    await isolate('checking');
    try {
      const { data } = await apiGet<{ data: SimulationSession }>('role-simulation');
      if (currentIdentity() !== identity) return false;
      applySession(data);
      return true;
    } catch {
      if (currentIdentity() !== identity) return false;
      useSimulationStore.setState({
        phase: 'error',
        error: 'Impossible de vérifier le mode simulation. Réessayez avant de continuer.',
      });
      return true;
    } finally {
      if (checking === run) checking = null;
    }
  })();
  checking = run;
  return run.promise;
}

export async function startSimulation(role: Role, tenantId?: string): Promise<string> {
  const current = useSimulationStore.getState();
  if (
    current.phase !== 'ready' ||
    current.session?.simulated_role ||
    !current.session?.allowed_roles.includes(role)
  )
    throw new Error('Ce rôle ne peut pas être simulé.');
  const returnPath = window.location.pathname + window.location.search;
  await isolate('transition');
  try {
    const { data } = await apiPost<{ data: SimulationSession }>('role-simulation', {
      simulated_role: role,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    });
    useSimulationStore.setState({ returnPath });
    applySession(data);
    notifyOtherTabs();
    return roleHome(data.simulated_role);
  } catch (error) {
    // The request may have reached the server even if its response was lost.
    // Never unlock real writes until the server state is known again.
    await synchronizeSimulation();
    throw error;
  }
}

export async function endSimulation(): Promise<string> {
  const current = useSimulationStore.getState();
  if (current.phase === 'transition' || current.phase === 'checking')
    throw new Error('Veuillez patienter.');
  const destination = current.returnPath ?? roleHome(useAuthStore.getState().user?.role ?? null);
  await isolate('transition');
  try {
    await apiDelete('role-simulation');
    clearSimulationData();
    useAuthStore.getState().setSimulatedRole(null);
    useSimulationStore.setState((state) => ({
      session: state.session ? { ...state.session, simulated_role: null, tenant_id: null } : null,
      phase: 'ready',
      returnPath: null,
      error: null,
      epoch: state.epoch + 1,
    }));
    notifyOtherTabs();
    return destination;
  } catch (error) {
    await synchronizeSimulation();
    throw error;
  }
}

export function clearSimulationContext() {
  cancelSimulationRequests();
  clearSimulationData();
  useSimulationStore.setState({ phase: 'ready', session: null, returnPath: null, error: null });
}
