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
type Revalidation = { promise: Promise<void> };
let revalidating: Revalidation | null = null;

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

/**
 * Only the simulated identity justifies isolating: it is what scopes the cache,
 * the local engine and the writes. `allowed_roles`/`shop_tenants` merely feed the
 * role switcher. A simulated role whose local engine is gone counts as a change
 * too, since applySession is what rebuilds it (see the Fast Refresh recovery).
 */
function authorityChanged(next: SimulationSession, current: SimulationSession | null): boolean {
  return (
    current === null ||
    next.simulated_role !== current.simulated_role ||
    next.tenant_id !== current.tenant_id ||
    (next.simulated_role !== null && !hasSimulationData(next.simulated_role))
  );
}

/**
 * Re-checks the server without blocking a session it has already verified.
 *
 * synchronizeSimulation isolates up front because nothing may be mounted before
 * the server has spoken. A tab regaining focus is not that case: the session was
 * already authoritative and the answer is almost always identical, so the GET
 * runs silently behind the mounted pages and only a real change pays for the
 * spinner and the cache wipe. Concurrent callers share the one request.
 */
export function revalidateSimulation(): Promise<void> {
  if (revalidating) return revalidating.promise;
  const identity = currentIdentity();
  const run: Revalidation = { promise: Promise.resolve() };
  run.promise = (async () => {
    try {
      const { data } = await apiGet<{ data: SimulationSession }>('role-simulation');
      if (currentIdentity() !== identity) return;
      // A full check started meanwhile owns the store: never race it.
      const current = useSimulationStore.getState();
      if (current.phase !== 'ready') return;
      if (!authorityChanged(data, current.session)) {
        useSimulationStore.setState({ session: data });
        return;
      }
      await isolate('checking');
      if (currentIdentity() !== identity) return;
      applySession(data);
    } catch {
      // A verified session must survive a failed re-check: no error screen here.
      // httpClient already handles a 401, and the next real request would fail
      // the same way, so nothing stays unlocked that the server refuses.
    } finally {
      if (revalidating === run) revalidating = null;
    }
  })();
  revalidating = run;
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
